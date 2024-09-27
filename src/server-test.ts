import { MongoClient } from "mongodb"
import {
    Cmd,
    CoopRepository,
    exportExForm,
    ICoopNet,
    importDocument,
    IStorage,
    parseCmds,
    RadixConvert,
    Repository,
} from "@kcdesign/data"
import { mysqlConn, retryMysqlConnect, waitMysqlConn } from "./mysql_db"
import config from "./config"
import { init as palInit } from "./pal/init"
import { OssStorage, S3Storage, StorageOptions } from "./storage"
import * as exit_util from "./utils/exit_util"
import * as console_util from "./utils/console_util"
import * as times_util from "./utils/times_util"
import * as fs from "fs";

console_util.objectToStr()

let mongoDBClient: MongoClient
let storage: IStorage

type Document = {
    id: string
    path: string
    version_id: string
    last_cmd_id: string
}

async function getDocument(documentId: string): Promise<Document | undefined> {
    return new Promise<Document | undefined>((resolve, reject) => {
        mysqlConn.query(`select d.id, d.path, d.version_id, dv.last_cmd_id
from document d
inner join document_version dv on dv.document_id=d.id and dv.version_id=d.version_id and dv.deleted_at is null
where d.id=${documentId} and d.deleted_at is null
limit 1`,
            (err, rows) => {
                if (err) reject(err);
                const _rows = rows as Document[]
                resolve(_rows.length > 0 ? _rows[0] : undefined)
            },
        )
    })
}

type _Cmd = {
    baseVer: string,
    batchId: string,
    ops: any[],
    isRecovery: boolean,
    description: string,
    time: bigint,
    posttime: bigint,
}

type CmdItem = {
    _id: bigint
    previous_id: bigint
    batch_start_id: bigint
    batch_end_id: bigint
    batch_length: number
    document_id: bigint
    user_id: bigint
    cmd: _Cmd
    cmd_id: string
}

async function findCmdItem(documentId: bigint, startCmdId?: bigint, endCmdId?: bigint): Promise<CmdItem[]> {
    console.log("findCmdItem", documentId, startCmdId, endCmdId)
    let mongoDB = mongoDBClient.db("kcserver")
    if (startCmdId === undefined && endCmdId === undefined) return Promise.resolve([]);
    const documentCollection = mongoDB.collection("document1")
    const findQuery: any = {
        document_id: documentId,
        _id: {},
    }
    if (startCmdId !== undefined) findQuery._id["$gte"] = startCmdId;
    if (endCmdId !== undefined) findQuery._id["$lte"] = endCmdId;
    if (startCmdId === undefined && endCmdId === undefined) delete findQuery._id;
    const findCursor = documentCollection.find(findQuery, { sort: { _id: 1 } })
    return await findCursor.toArray() as any as CmdItem[]
}

function parseCmdList(cmdItemList: CmdItem[]): Cmd[] {
    return parseCmds(cmdItemList.map(cmdItem => {
        const cmd = cmdItem.cmd as any
        cmd.id = cmdItem.cmd_id
        cmd.version = radixRevert.from(cmdItem._id)
        cmd.previousVersion = radixRevert.from(cmdItem.previous_id)
        cmd.time = Number(cmd.time)
        cmd.posttime = Number(cmd.posttime)
        return cmd
    }))
}

const radixRevert = new RadixConvert(62)

class CoopNet implements ICoopNet {
    private documentId: bigint
    constructor(documentId: bigint) {
        this.documentId = documentId
    }
    hasConnected(): boolean {
        return true;
    }
    async pullCmds(from: string, to: string): Promise<Cmd[]> {
        const startCmdId = from ? radixRevert.to(from) : 0n
        const endCmdId = to ? radixRevert.to(to) : undefined
        const cmdItemList = await findCmdItem(this.documentId, startCmdId, endCmdId)
        return parseCmdList(cmdItemList)
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }
    watchCmds(watcher: (cmds: Cmd[]) => void): void {

    }

    watchError(watcher: (errorInfo: any) => void): void {

    }
}

async function generateNewVersion(documentInfo: Document): Promise<boolean> {
    const cmdItemList = await findCmdItem(BigInt(documentInfo.id), BigInt(documentInfo.last_cmd_id))
    const cmdList = parseCmdList(cmdItemList)
    if (cmdList.length === 0) {
        console.log(`[${documentInfo.id}]无新cmd，不需要生成新版本`)
        return true
    }

    const repo = new Repository()
    const d = await importDocument(storage, documentInfo.path, "", documentInfo.version_id, repo)
    const document = d.document

    const coopRepo = new CoopRepository(d.document, repo)
    coopRepo.setNet(new CoopNet(BigInt(documentInfo.id)))
    coopRepo.setBaseVer(radixRevert.from(documentInfo.last_cmd_id))

    console_util.disableConsole(console_util.ConsoleType.log)
    try {
        const timeoutPromise = times_util.sleepAsyncReject(1000 * 10, new Error("coopRepo.receive超时"))
        const p = new Promise<void>((resolve, reject) => {
            coopRepo.setProcessCmdsTrigger(() => {
                resolve()
            })
            coopRepo.receive(cmdList)
        })
        await Promise.race([p, timeoutPromise])
    } catch (err) {
        console_util.enableConsole(console_util.ConsoleType.log)
        console.log(`[${documentInfo.id}]generateNewVersion错误：coopRepo.receive错误`, err)
        return false
    }
    console_util.enableConsole(console_util.ConsoleType.log)

    try {
        const documentData = await exportExForm(document)
        const documentDataJson = JSON.stringify(documentData)
        fs.writeFileSync(`./${documentInfo.id}.json`, documentDataJson)
    } catch (err) {
        console.log(`[${documentInfo.id}]generateNewVersion错误：上传错误`, err)
        return false
    }

    console.log(`[${documentInfo.id}]生成新版本成功`)
    return true
}

async function test() {
    const documentId = "336095522538405888"
    const documentInfo = await getDocument(documentId)
    if (!documentInfo) {
        console.log("document不存在")
        return
    }
    await generateNewVersion(documentInfo)
}

async function run() {
    try {
        await retryMysqlConnect(3)
    } catch (err) {
        console.log("mysql连接失败", err)
        return
    }
    await waitMysqlConn()

    try {
        mongoDBClient = await MongoClient.connect(config.mongodb.url, {
            useBigInt64: true,
        })
    } catch (err) {
        console.log("mongodb连接失败", err)
        throw err
    }

    const storageConfig = config.storage
    const storageOptions: StorageOptions = {
        endPoint: storageConfig.endPoint,
        region: storageConfig.region,
        accessKey: storageConfig.accessKeyId,
        secretKey: storageConfig.secretAccessKey,
        bucketName: storageConfig.bucketName,
    }
    storage = config.storage.type === "oss" ? new OssStorage(storageOptions) : new S3Storage(storageOptions)

    await palInit()

    await test()
    await exit_util.exit()
}

run()

exit_util.addFun(async () => {

})

// 捕捉未处理的异常
process.on("uncaughtException", (err) => {
    console.log("uncaughtException", err)
})

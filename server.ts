import {MongoClient} from "mongodb"
import {
    Cmd,
    CoopRepository,
    exportExForm,
    exportSvg,
    importDocument,
    IStorage,
    RadixConvert,
    Repository,
    parseCmds,
    ICoopNet,
} from "@kcdesign/data"
import {mysqlConn, retryMysqlConnect, waitMysqlConn} from "./mysql_db"
import config from "./config"
import {init as palInit} from "./pal/init"
import {OssStorage, S3Storage, StorageOptions} from "./storage"
import * as exit_util from "./utils/exit_util"
import * as console_util from "./utils/console_util"
import * as times_util from "./utils/times_util"
import {WebSocket} from "ws"
import Koa from "koa"
import Router from "koa-router"
import BodyParser from "koa-bodyparser"
import axios from "axios"
import FormData from "form-data"

console_util.objectToStr()

// 触发生成新版本的最小cmd数量
const MinCmdCount = 100

const ServerPort = 10040

const DOCUMENT_SERVICE_HOST = config.documentService.host
const API_VERSION_PATH = "/api/v1"
const DOCUMENT_UPLOAD_PATH = "/documents/document_upload"
const DOCUMENT_UPLOAD_URL = `ws://${DOCUMENT_SERVICE_HOST}${API_VERSION_PATH}${DOCUMENT_UPLOAD_PATH}`

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
    const findCursor = documentCollection.find(findQuery, {sort: {_id: 1}})
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

async function svgToPng(svgContent: string): Promise<Buffer> {
    const svgBuffer = Buffer.from(svgContent, "utf-8")

    const form = new FormData()
    form.append("svg", svgBuffer, {
        filename: "image.svg",
        contentType: "image/svg+xml",
    })

    const response = await axios.post<Buffer>("http://172.16.0.21:10050/svg_to_png", form, {
        headers: {
            ...form.getHeaders()
        },
        responseType: "arraybuffer",
    })
    if (response.status !== 200) {
        console.log("svgToPng错误", response.status, response.data)
        throw new Error("svgToPng错误")
    }

    return response.data
}

async function generateNewVersion(documentInfo: Document): Promise<boolean> {
    const cmdItemList = await findCmdItem(BigInt(documentInfo.id), BigInt(documentInfo.last_cmd_id))
    const cmdList = parseCmdList(cmdItemList)
    if (cmdList.length === 0) {
        console.log(`[${documentInfo.id}]无新cmd，不需要生成新版本`)
        return true
    }
    if (cmdList.length < MinCmdCount) {
        console.log(`[${documentInfo.id}]cmd数量小于${MinCmdCount}，不需要生成新版本`)
        return true
    }

    const repo = new Repository()
    const document = await importDocument(storage, documentInfo.path, "", documentInfo.version_id, repo)

    const coopRepo = new CoopRepository(document, repo)
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

    // 导出page图片
    const pageImageBase64List: string[] = []
    for (const _page of document.pagesList) {
        const page = await document.pagesMgr.get(_page.id);
        if (!page) continue;
        try {
            const pageSvg = exportSvg(page)
            if (!pageSvg) continue;
            const pagePngBuffer = await svgToPng(pageSvg)
            pageImageBase64List.push(pagePngBuffer.toString("base64"))
        } catch (err) {
            console.log("导出page图片失败", err)
        }
    }

    try {
        const documentData = await exportExForm(document)
        const ws = new WebSocket(DOCUMENT_UPLOAD_URL)
        await new Promise<void>((resolve, reject) => {
            ws.onopen = _ => resolve()
            ws.onerror = err => reject(err)
        })
        ws.binaryType = "arraybuffer"
        const lastCmdId = cmdItemList[cmdItemList.length - 1]._id.toString(10)
        let mediasSize = 0
        for (let i = 0, len = documentData.media_names.length; i < len; i++) {
            const buffer = await document.mediasMgr.get(documentData.media_names[i])
            if (buffer !== undefined) mediasSize += buffer.buff.byteLength;
        }
        const documentText = await document.getText()
        ws.send(JSON.stringify({
            document_id: documentInfo.id,
            last_cmd_id: lastCmdId,
        }))
        ws.send(JSON.stringify({
            ...documentData,
            medias_size: mediasSize,
            document_text: documentText,
            page_image_base64_list: pageImageBase64List,
        }))
        const versionId = await new Promise<string>((resolve, reject) => {
            let isClosed = false
            ws.onmessage = ((event) => {
                if (isClosed) return;
                try {
                    const data = JSON.parse(event.data as string)
                    const status = data.status
                    const versionId = data.data?.version_id
                    if (status !== "success" || !versionId) {
                        console.log(`[${documentInfo.id}]generateNewVersion错误：document upload fail`, data)
                        reject()
                        return
                    }
                    resolve(versionId)
                } catch (e) {
                    console.log(`[${documentInfo.id}]generateNewVersion错误：document upload fail`, e)
                    reject()
                }
                isClosed = true
                ws.close()
            })
            setTimeout(() => {
                if (isClosed) return;
                console.log(`[${documentInfo.id}]generateNewVersion错误：document upload timeout`)
                reject()
                isClosed = true
                ws.close()
            }, 1000 * 10)
        })
    } catch (err) {
        console.log(`[${documentInfo.id}]generateNewVersion错误：上传错误`, err)
        return false
    }

    console.log(`[${documentInfo.id}]生成新版本成功`)
    return true
}

const app = new Koa()
const router = new Router()

router.get("/health_check", async (ctx, next) => {
    ctx.body = "success"
})

router.post("/generate", async (ctx, next) => {
    const reqParams = ctx.request.body as any
    let documentId = reqParams.documentId
    if (!documentId) {
        ctx.status = 400
        ctx.body = "参数错误"
        return
    }
    documentId = documentId + ""
    console.log("generate", documentId)

    const documentInfo = await getDocument(documentId)
    if (!documentInfo) {
        ctx.status = 400
        ctx.body = "document不存在"
        return
    }

    const result = await generateNewVersion(documentInfo)
    if (result) {
        ctx.body = "success"
    } else {
        ctx.status = 500
        ctx.body = "error"
    }
})

app.use(BodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

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

    const storageConfig: typeof config.s3 | typeof config.oss = config.storageType === "oss" ? config.oss : config.s3
    const storageOptions: StorageOptions = {
        endPoint: storageConfig.endPoint,
        region: storageConfig.region,
        accessKey: storageConfig.accessKeyId,
        secretKey: storageConfig.secretAccessKey,
        bucketName: storageConfig.bucketName,
    }
    storage = config.storageType === "oss" ? new OssStorage(storageOptions) : new S3Storage(storageOptions)

    await palInit()

    app.listen(ServerPort, () => {
        console.log(`manager服务已启动 ${ServerPort}`)
    })
}

run()

exit_util.addFun(async () => {

})

// 捕捉未处理的异常
process.on("uncaughtException", (err) => {
    console.log("uncaughtException", err)
})

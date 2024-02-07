import {mysqlConn, retryMysqlConnect, waitMysqlConn} from "./mysql_db"
import * as exit_utils from "./utils/exit_util"
import {MongoClient} from "mongodb"
import config from "./config"
import {
    Cmd,
    CmdArray,
    CoopRepository,
    exportExForm,
    importCmdArray,
    importDocument,
    IStorage,
    Repository
} from "@kcdesign/data"
import * as console_utils from "./utils/console_util"
import {OssStorage, S3Storage, StorageOptions} from "./storage"
import {WebSocket} from "ws"
import * as fs from "fs"
import * as path from "path"

const beginDocumentId = "0"
const endDocumentId = ""
const documentCountPerBatch = 100

const logFilePath: string = path.join(__dirname, "all.log")
const errorLogFilePath: string = path.join(__dirname, "error.log")
const successLogFilePath: string = path.join(__dirname, "success.log")

function logError(data: string) {
    fs.appendFileSync(errorLogFilePath, data + "\n")
}

function logSuccess(data: string) {
    fs.appendFileSync(successLogFilePath, data + "\n")
}

const shieldPrefix = [
    "shape not find",
    "exec error:",
    "error cmd:",
]

console_utils.objectToStr({
    beforeHandler: (type, content) => {
        for (const prefix of shieldPrefix) if (content.startsWith(prefix)) return false;
        return true
    },
    handler: (type, content) => {
        fs.appendFileSync(logFilePath, `console.${type} ${content}\n`)
    },
})

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

async function getDocumentList(beginDocumentId: string, count: number): Promise<Document[]> {
    return new Promise<Document[]>((resolve, reject) => {
        mysqlConn.query(`select d.id, d.path, d.version_id, dv.last_cmd_id
from document d
inner join document_version dv on dv.document_id=d.id and dv.version_id=d.version_id and dv.deleted_at is null
where d.id>${beginDocumentId} and d.deleted_at is null
limit ${count}`,
            (err, rows) => {
                if (err) reject(err);
                resolve(rows as Document[])
            },
        )
    })
}

async function findCmdRaw(documentId: bigint, startCmdId?: bigint, endCmdId?: bigint): Promise<any[]> {
    let mongoDB = mongoDBClient.db("kcserver")
    if (startCmdId === undefined && endCmdId === undefined) return Promise.resolve([]);
    const documentCollection = mongoDB.collection("document")
    const findQuery: any = {
        document_id: documentId,
        _id: {},
    }
    if (startCmdId !== undefined) findQuery._id["$gte"] = startCmdId;
    if (endCmdId !== undefined) findQuery._id["$lte"] = endCmdId;
    const findCursor = documentCollection.find(findQuery, {sort: {_id: 1}})
    return findCursor.toArray()
}

async function findCmd(documentId: bigint, startCmdId?: bigint, endCmdId?: bigint): Promise<Cmd[]> {
    return new Promise((resolve) => {
        findCmdRaw(documentId, startCmdId, endCmdId).then((dataList: any[]) => {
            try {
                const res = importCmdArray({
                    cmds: dataList.map(item => {
                        item.cmd["serverId"] = item._id.toString(10)
                        item.cmd["userId"] = item.user_id.toString(10)
                        return item.cmd
                    })
                } as CmdArray)
                if (res.cmds === undefined) {
                    console.log("cmds为空")
                    resolve([])
                    return
                }
                resolve(res.cmds)
            } catch (err) {
                console.log("cmd转换错误", err)
                resolve([])
                return
            }
        }).catch(err => {
            console.log(err)
            resolve([])
        })
    })
}

async function generateNewVersion(documentInfo: Document): Promise<boolean> {
    console.log(`[${documentInfo.id}]开始生成新版本`)

    const cmdList = await findCmd(BigInt(documentInfo.id), BigInt(documentInfo.last_cmd_id))
    if (cmdList.length === 0) {
        logSuccess(documentInfo.id)
        return true
    }

    const repo = new Repository()
    const document = await importDocument(storage, documentInfo.path, "", documentInfo.version_id, repo)
    const coopRepo = new CoopRepository(document, repo)

    try {
        for (const cmd of cmdList) coopRepo.execRemote(cmd);
    } catch (err) {
        console.log(`[${documentInfo.id}]generateNewVersion错误：execRemote错误`, err)
        logError(documentInfo.id)
        return false
    }

    try {
        const documentData = await exportExForm(document)
        const ws = new WebSocket(DOCUMENT_UPLOAD_URL)
        await new Promise<void>((resolve, reject) => {
            ws.onopen = _ => resolve()
            ws.onerror = err => reject(err)
        })
        ws.binaryType = "arraybuffer"
        const lastCmdId = cmdList[cmdList.length - 1].serverId
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
        logError(documentInfo.id)
        return false
    }

    logSuccess(documentInfo.id)
    return true
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
        mongoDBClient = await MongoClient.connect(config.mongodb.url, {})
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
    if (config.storageType === "oss") storage = new OssStorage(storageOptions);
    else storage = new S3Storage(storageOptions);

    let currentDocumentId = beginDocumentId
    while (1) {
        const documentList = await getDocumentList(currentDocumentId, documentCountPerBatch)
        if (documentList.length === 0) break;
        if (endDocumentId && BigInt(documentList[documentList.length - 1].id) > BigInt(endDocumentId)) documentList.splice(documentList.findIndex(document => BigInt(document.id) > BigInt(endDocumentId)));
        if (documentList.length === 0) break;
        for (const document of documentList) await generateNewVersion(document);
        currentDocumentId = documentList[documentList.length - 1].id
        if (documentList.length < documentCountPerBatch) break;
    }

    exit_utils.exit()
}

run()

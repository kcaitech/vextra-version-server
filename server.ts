import {MongoClient} from "mongodb"
import {
    Cmd,
    CoopRepository,
    exportExForm,
    exportSvg,
    importDocument,
    IStorage,
    RadixConvert,
    Repository
} from "@kcdesign/data"
import {mysqlConn, retryMysqlConnect, waitMysqlConn} from "./mysql_db"
import config from "./config"
import sharp from "sharp"
import {OssStorage, S3Storage, StorageOptions} from "./storage"
import * as exit_util from "./utils/exit_util"
import Koa from "koa"
import Router from "koa-router"
import BodyParser from "koa-bodyparser"

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
where d.id>${documentId} and d.deleted_at is null
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
    const documentCollection = mongoDB.collection("document")
    const findQuery: any = {
        document_id: documentId,
        _id: {},
    }
    if (startCmdId !== undefined) findQuery._id["$gte"] = startCmdId;
    if (endCmdId !== undefined) findQuery._id["$lte"] = endCmdId;
    const findCursor = documentCollection.find(findQuery, {sort: {_id: 1}})
    return await findCursor.toArray() as any as CmdItem[]
}

function parseCmdList(cmdItemList: CmdItem[]): Cmd[] {
    return cmdItemList.map(cmdItem => {
        const cmd = cmdItem.cmd as any
        cmd.id = cmdItem.cmd_id
        cmd.version = radixRevert.from(cmdItem._id)
        cmd.previousVersion = radixRevert.from(cmdItem.previous_id)
        cmd.time = Number(cmd.time)
        cmd.posttime = Number(cmd.posttime)
        return cmd
    })
}

const radixRevert = new RadixConvert(62)

async function generateNewVersion(documentInfo: Document): Promise<boolean> {
    console.log(`[${documentInfo.id}]开始生成新版本`)

    const cmdItemList = await findCmdItem(BigInt(documentInfo.id), BigInt(documentInfo.last_cmd_id))
    const cmdList = parseCmdList(cmdItemList)
    if (cmdList.length === 0) {
        console.log(`[${documentInfo.id}]无新cmd，不需要生成新版本`)
        return true
    }

    const repo = new Repository()
    const document = await importDocument(storage, documentInfo.path, "", documentInfo.version_id, repo)
    const coopRepo = new CoopRepository(document, repo)

    try {
        coopRepo.receive(cmdList)
    } catch (err) {
        console.log(`[${documentInfo.id}]generateNewVersion错误：execRemote错误`, err)
        return false
    }

    // 导出page图片
    const pageImageBase64List: string[] = []
    for (const _page of document.pagesList) {
        const page = await document.pagesMgr.get(_page.id);
        if (!page) continue;
        try {
            const pageSvg = exportSvg(page)
            if (!pageSvg) continue;
            const pagePngBuffer = await sharp(Buffer.from(pageSvg)).png().toBuffer()
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
    if (config.storageType === "oss") storage = new OssStorage(storageOptions);
    else storage = new S3Storage(storageOptions);
}

const app = new Koa()
const router = new Router()
app.use(BodyParser())

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

app.listen(ServerPort, () => {
    console.log(`manager服务已启动 ${ServerPort}`)
})

exit_util.addFun(async () => {

})

// 捕捉未处理的异常
process.on("uncaughtException", (err) => {
    console.log("uncaughtException", err)
})

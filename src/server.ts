import { MongoClient } from "mongodb"
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
    ImageShape,
    Page,
    ShapeType,
} from "@kcdesign/data"
import { db } from "./mysql_db"
import config from "./config"
import { init as palInit } from "./pal/init"
import { OssStorage, S3Storage, StorageOptions } from "./storage"
import * as exit_util from "./utils/exit_util"
import * as console_util from "./utils/console_util"
import * as times_util from "./utils/times_util"
import { WebSocket } from "ws"
import Koa from "koa"
import Router from "koa-router"
import BodyParser from "koa-bodyparser"
import Static from "koa-static"
import axios from "axios"
import FormData from "form-data"
import { DocumentInfo } from "./basic"
import { upload } from "./document_upload"

console_util.objectToStr()

// 触发生成新版本的最小cmd数量
const MinCmdCount = 100

const ServerPort = 10040

// 直接上传oss
// const DOCUMENT_SERVICE_HOST = config.documentService.host
// const API_VERSION_PATH = "/api/v1"
// const DOCUMENT_UPLOAD_PATH = "/documents/document_upload"
// const DOCUMENT_UPLOAD_URL = `ws://${DOCUMENT_SERVICE_HOST}${API_VERSION_PATH}${DOCUMENT_UPLOAD_PATH}`

let mongoDBClient: MongoClient
let storage: IStorage


const app = new Koa()
const router = new Router()

router.get("/health_check", async (ctx, next) => {
    if (!palInitFinished) {
        ctx.status = 500
        ctx.body = "初始化未完成"
        return
    }
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
app.use(Static("/app/static"))

let palInitFinished = false

async function run() {

    await db()

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

    app.listen(ServerPort, () => {
        console.log(`manager服务已启动 ${ServerPort}`)
        palInit().then(() => palInitFinished = true).catch(err => console.log("palInit错误", err))
    })
}

run()

exit_util.addFun(async () => {

})

// 捕捉未处理的异常
process.on("uncaughtException", (err) => {
    console.log("uncaughtException", err)
})

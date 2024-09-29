
import { db } from "./mysql_db"
import config from "./config"
import { init as palInit } from "./pal/init"
import { storage } from "./storage"
import * as exit_util from "./utils/exit_util"
import * as console_util from "./utils/console_util"
import Koa from "koa"
import Router from "koa-router"
import Static from "koa-static"
import { generate } from "./generate"
import { mongodb } from "./mongo"

console_util.objectToStr()

const app = new Koa()
const router = new Router()

router.get("/health_check", async (ctx, next) => {
    if (!palInitFinished) {
        ctx.status = 500
        ctx.body = "初始化未完成"
        return
    }
    await db()
    await mongodb();
    await storage();

    ctx.body = "success"
})

router.get("/generate", async (ctx, next) => {
    const { documentId } = ctx.query;
    // const reqParams = ctx.request.body as any
    // let documentId = reqParams.documentId
    if (!documentId) {
        ctx.status = 400
        ctx.body = "参数错误"
        return
    }
    const result = await generate(documentId as string);

    if (result) {
        ctx.body = result
    } else {
        ctx.status = 500
        ctx.body = "error"
    }
})

// app.use(BodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(Static("/app/static"))

let palInitFinished = false

async function run() {

    await db()
    await mongodb();
    await storage();

    app.listen(config.port, () => {
        console.log(`manager服务已启动 ${config.port}`)
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

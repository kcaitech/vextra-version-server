// import { db } from "./mysql_db"
import { init as palInit } from "./pal/init"
import { storage } from "./storage"
import * as exit_util from "./utils/exit_util"
import Koa from "koa"
import Router from "koa-router"
import Static from "koa-static"
import bodyParser from "koa-bodyparser"
import { generate } from "./generate"
// import { mongodb } from "./mongo"
import logger from "koa-logger"
import { ServerPort } from "./consts"
import { shortLog } from "./utils/shortlog"
import { mongodb } from "./mongo"

// import * as console_util from "./utils/console_util"
// console_util.objectToStr()

shortLog()

const app = new Koa()
const router = new Router()

app.use(logger())
app.use(bodyParser({
    jsonLimit: '2mb',
    formLimit: '2mb',
    textLimit: '2mb',
    xmlLimit: '2mb'
}))

router.get("/health_check", async (ctx, next) => {
    if (!palInitFinished) {
        ctx.status = 500
        ctx.body = "初始化未完成"
        return
    }

    await mongodb();
    await storage();

    ctx.body = "success"
})

router.post("/generate", async (ctx, next) => {
    const reqParams = ctx.request.body as any;
    const documentInfo = reqParams.documentInfo;
    const cmdItemList = reqParams.cmdItemList;
    if (!documentInfo || !cmdItemList) {
        ctx.status = 400;
        ctx.body = "参数错误：缺少documentInfo或cmdItemList";
        return;
    }

    const { result, err } = await generate(documentInfo, cmdItemList);
    
    if (result) {
        ctx.body = result;
    } else {
        ctx.status = 202;
        ctx.body = err;
    }
})
// app.use(BodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(Static("/app/static"))

let palInitFinished = false
const port = ServerPort

async function run() {
    await storage();
    await mongodb();

    app.listen(port, () => {
        console.log(`kcversion服务已启动 ${port}`)
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

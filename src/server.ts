import { initModule } from "./pal/init"
import { storage } from "./provider/storage"
import * as exit_util from "./utils/exit_util"
import express from "express"
import morgan from "morgan"
import { ServerPort } from "./config"
import { shortLog } from "./utils/shortlog"
import { mongodb } from "./provider/mongo"
import yargs from "yargs"
import { generate_handler } from "./handler/generate_handler"

// 解析命令行参数
// 用yargs从运行参数中获取token
const argv = yargs(process.argv).option('port', {
    type: 'string',
    describe: 'port',
    default: ServerPort.toString()
}).argv as { port: string };

console.log("argv", argv)

shortLog()

const app = express()

app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb' 
}))
app.use(express.text({ limit: '50mb' }))

app.get("/health_check", async (req, res) => {
    try {
        await storage();
        await mongodb();
        await initModule();

        res.send("success")
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
})

app.post("/generate", generate_handler)

const port = parseInt(argv.port)

async function run() {
    await storage();
    await mongodb();
    await initModule();
    app.listen(port, () => {
        console.log(`kcversion服务已启动，监听端口: ${port}`)
    })
}

run()

exit_util.addFun(async () => {

})

// 捕捉未处理的异常
process.on("uncaughtException", (err) => {
    console.log("uncaughtException", err)
})

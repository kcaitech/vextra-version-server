/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { initModule } from "./pal/init"
import { storage } from "./provider/storage"
import * as exit_util from "./utils/exit_util"
import express from "express"
import morgan from "morgan"
import { shortLog } from "./utils/shortlog"
import { mongodb } from "./provider/mongo"
import yargs from "yargs"
import { generate_handler } from "./handler/generate_handler"
import { health_handler } from "./handler/health_handler"
import { initConfig } from "./config"

const defaultPort = 30000
const defaultConfigFile = "config/config.yaml"

// 解析命令行参数
// 用yargs从运行参数中获取token
const argv = yargs(process.argv).option('port', {
    type: 'string',
    describe: 'port',
    default: defaultPort
}).option('config', {
    type: 'string',
    describe: 'config file',
    default: defaultConfigFile
}).argv as { port: number, config: string };

console.log("argv", argv)

shortLog()
initConfig(argv.config)

const app = express()
app.get("/health", health_handler)

app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb' 
}))
app.use(express.text({ limit: '50mb' }))

app.post("/generate", generate_handler)

const port = (argv.port)

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

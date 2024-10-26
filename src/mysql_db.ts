import * as mysql from "mysql"
import config from "./config"

function mysqlCreateConnection() {
    return mysql.createConnection({
        host: config.db.host,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        port: config.db.port
    })
}

const mysqlConn = mysqlCreateConnection()
let mysqlConnPromise: Promise<void> | undefined
export async function waitMysqlConn() {
    if (mysqlConnPromise == undefined) return;
    await mysqlConnPromise
}

async function mysqlConnect() {
    // mysqlConn = mysqlCreateConnection()
    return new Promise<void>((resolve, reject) => {
        mysqlConn.connect((err) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
            mysqlConn.on("error", (err) => {
                console.log("mysql连接错误，创建新连接", err)
                let resolve: (value: void) => void
                mysqlConnPromise = new Promise<void>(r => resolve = r)
                retryMysqlConnect(10, 2000).then(() => {
                    resolve()
                    mysqlConnPromise = undefined
                }).catch(err => {
                    console.log("mysql创建新连接失败，程序退出", err)
                    process.exit(1)
                })
            })
        })
    })
}

// retryCount=0表示不重试，retryCount=-1表示无限重试
async function retryMysqlConnect(retryCount: number, retryInterval: number = 1000) {
    if (retryInterval < 1000) retryInterval = 1000;
    let count = 0
    while (true) {
        try {
            await mysqlConnect()
            return
        } catch (err) {
            if (retryCount !== -1 && count >= retryCount) {
                console.log("mysql连接失败")
                throw err
            }
            console.log("mysql连接失败，重试中", err)
            await new Promise<void>(resolve => setTimeout(resolve, retryInterval))
            count++
        }
    }
}

let connected = false;

export async function db() {
    if (!connected) {
        try {
            await retryMysqlConnect(3)
        } catch (err) {
            console.log("mysql连接失败", err)
            throw err;
        }
        connected = true;
    }
    await waitMysqlConn();
    return mysqlConn
}
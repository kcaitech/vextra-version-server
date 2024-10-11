
type Mysql = {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
}

type Mongodb = {
    uri: string,
    db: string
}

type Storage = {
    type: string // 's3' | 'oss'
    endPoint: string,
    region: string,
    accessKeyID: string,
    secretAccessKey: string,
    bucketName: string,
    filesBucketName: string
}

// type UploadApi = {
//     url: string
// }

// type Redis = {
//     address: string,
//     password: string,
//     db: number,
//     sentinel: string,
//     sentinelAddrs: string[],
//     masterName: string
// }

type Config = {
    mysql: Mysql,
    mongo: Mongodb,
    storage: Storage
    // redis: Redis
    min_cmd_count: number
    port: number
}

// sae的变量由env传递
// k8s可由configmap或者secret进行文件挂载

import fs from "fs"
import example from "../config/config.json"
function compile_check(_: Config) { }
compile_check(example)

let config: Config = example;
const configfile = 'config/config.json'
if (process.env.kcconfig) {
    config = Object.assign(config, JSON.parse(process.env.kcconfig));
}
else if (fs.existsSync(configfile)) {
    const cf = fs.readFileSync(configfile);
    config = Object.assign(config, JSON.parse(cf.toString()));
}

export default config;

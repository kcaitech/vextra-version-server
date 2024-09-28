
type Mysql = {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
}

type Mongodb = {
    url: string
}

type Storage = {
    type: string // 's3' | 'oss'
    endPoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucketName: string,
    filesBucketName: string
}

type UploadApi = {
    url: string
}

type Redis = {
    address: string,
    password: string,
    db: number,
    sentinel: string,
    sentinelAddrs: string[],
    masterName: string
}

type Config = {
    mysql: Mysql,
    mongodb: Mongodb,
    storage: Storage
    uploadApi: UploadApi,
    redis: Redis
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
    config = JSON.parse(process.env.kcconfig) as Config;
}
else if (fs.existsSync(configfile)) {
    const cf = fs.readFileSync('config/config.json');
    config = JSON.parse(cf.toString()) as Config;
}


export default config;


type Db = {
    url: string
}

type Mongodb = {
    url: string,
    db: string
}

type StorageProvider = {
    endpoint: string,
    region: string,
    accessKeyID: string,
    secretAccessKey: string,
    bucketName: string,
    filesBucketName: string
}

type Storage = {
    provider: string,
    minio?: StorageProvider,
    s3?: StorageProvider,
    oss?: StorageProvider
}

type Config = {
    db: Db,
    mongo: Mongodb,
    storage: Storage
    version_server: {
        min_cmd_count: number
    }
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

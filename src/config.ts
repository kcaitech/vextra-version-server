
type Mongodb = {
    url: string,
    db: string
}

type Storage = {
    provider: string,
    endpoint: string,
    region: string,
    accessKeyID: string,
    secretAccessKey: string,
    documentBucket: string,
}

// type Storage = {
//     provider: string,
//     minio?: StorageProvider,
//     s3?: StorageProvider,
//     oss?: StorageProvider
// }

type Config = {
    mongo: Mongodb,
    storage: Storage
}

// sae的变量由env传递
// k8s可由configmap或者secret进行文件挂载
import yaml from "js-yaml"
import fs from "fs"

let _config: Config;

export function initConfig(config: string) {
    if (!fs.existsSync(config)) {
        throw new Error(`config file ${config} not found`)
    }
    const cf = fs.readFileSync(config);
    _config = yaml.load(cf.toString()) as Config;
    console.log("config", _config)
}

export function getConfig() {
    if (!_config) {
        throw new Error("config not initialized")
    }
    return _config;
}

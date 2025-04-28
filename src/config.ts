
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
    mongo: Mongodb,
    storage: Storage
}

// sae的变量由env传递
// k8s可由configmap或者secret进行文件挂载
import yaml from "js-yaml"
import fs from "fs"
import example from "../config/config.json"
function compile_check(_: Config) { }
compile_check(example)

let config: Config = example;
const configfile = 'config/config.yaml'
if (process.env.kcconfig) {
    config = Object.assign(config, JSON.parse(process.env.kcconfig));
}
else if (fs.existsSync(configfile)) {
    const cf = fs.readFileSync(configfile);
    config = Object.assign(config, yaml.load(cf.toString()));
}

export default config;

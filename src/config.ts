
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
    bucketName: string,
    filesBucketName: string
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

let config: Config;
const configfile = 'config/config.yaml'

if (!fs.existsSync(configfile)) {
    throw new Error(`config file ${configfile} not found`)
}

const cf = fs.readFileSync(configfile);
config = yaml.load(cf.toString()) as Config;

console.log("config", config)

export default config;

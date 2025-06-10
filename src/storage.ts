import { IO } from "@kcdesign/data"

export type StorageOptions = {
    endPoint: string
    region: string
    accessKey: string
    secretKey: string
    sessionToken?: string | undefined
    bucketName: string
}

import AWS from "aws-sdk"

AWS.config.correctClockSkew = true

export class S3Storage implements IO.IStorage {
    private client: AWS.S3
    private options: StorageOptions

    constructor(options: StorageOptions) {
        this.client = new AWS.S3({
            endpoint: options.endPoint,
            region: options.region,
            signatureVersion: "v4",
            credentials: {
                accessKeyId: options.accessKey,
                secretAccessKey: options.secretKey,
                sessionToken: options.sessionToken,
            },
            s3ForcePathStyle: true,
            sslEnabled: false,
            correctClockSkew: true,
        })
        this.options = options
    }

    public get(uri: string, versionId?: string): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            this.client.getObject({
                Bucket: this.options.bucketName,
                Key: uri,
                VersionId: versionId,
            }, (err, data) => {
                if (err) {
                    // reject(err)
                    console.log(err)
                    resolve(new Uint8Array())
                    return
                }
                resolve(data.Body as Uint8Array)
            })
        })
    }

    // 将二进制数据上传到指定的路径
    public put(uri: string, data: Uint8Array, contentType: string = "application/json"): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.client.putObject({
                Bucket: this.options.bucketName,
                Key: uri,
                Body: data,
                ContentType: contentType,
            }, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }
}

import OSS from "ali-oss"
import config from "./config"

export class OssStorage implements IO.IStorage {
    private client: OSS
    // private options: StorageOptions

    constructor(options: StorageOptions) {
        this.client = new OSS({
            endpoint: `${options.bucketName}.${options.endPoint}`,
            region: options.region,
            accessKeyId: options.accessKey,
            accessKeySecret: options.secretKey,
            bucket: options.bucketName,
            secure: false,
            internal: true,
            cname: true,
        })
        // this.options = options
    }

    private async _get(uri: string, versionId?: string): Promise<Uint8Array> {
        const result = await this.client.get(uri, {
            versionId: versionId,
        })
        if (result.res.status !== 200) {
            throw new Error(`${uri} 请求失败 status:${result.res.status}`)
        } else if (!(result.content instanceof Uint8Array)) {
            throw new Error(`${uri} 数据类型错误 content:${typeof result.content}`)
        }
        return result.content
    }

    public async get(uri: string, versionId?: string): Promise<Uint8Array> {
        let result: Uint8Array
        try {
            result = await this._get(uri, versionId)
        } catch (err) {
            console.log(err)
            result = await this._get(uri).catch(() => {
                // console.log("storage.get错误", uri, err)
                return new Uint8Array()
            })
        }
        return result
    }

    // 将二进制数据上传到指定的路径
    public async put(uri: string, data: Uint8Array, contentType: string = "application/json"): Promise<void> {
        await this.client.put(uri, Buffer.from(data), { headers: { "Content-Type": contentType } })
    }
}


let _storage: IO.IStorage
export async function storage() {
    if (!_storage) {
        const storageConfig = config.storage
        let _config
        if (storageConfig.provider === "oss") {
            _config = storageConfig.oss
        } else if (storageConfig.provider === "minio") {
            _config = storageConfig.minio
        } else if (storageConfig.provider === "s3") {
            _config = storageConfig.s3
        } else {
            throw new Error("unknow storage provider:" + storageConfig.provider + ". only support: oss, minio, s3")
        }
        if (!_config) {
            throw new Error("no storage config for " + storageConfig.provider)
        }

        const storageOptions: StorageOptions = {
            endPoint: _config.endpoint,
            region: _config.region,
            accessKey: _config.accessKeyID,
            secretKey: _config.secretAccessKey,
            bucketName: _config.bucketName,
        }
        // console.log("storage info:", storageOptions)
        _storage = config.storage.provider === "oss" ? new OssStorage(storageOptions) : new S3Storage(storageOptions)
    }
    return _storage;
}
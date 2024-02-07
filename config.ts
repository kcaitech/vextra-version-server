import { config as dotenvConfig } from "dotenv"
import * as path from "path"
import * as process from "process"

dotenvConfig({
    path: path.resolve(process.cwd(), ".env"),
})

export default {
    mysql: {
        host: process.env.MYSQL_HOST || "",
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || "",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "",
    },
    mongodb: {
        url: process.env.MONGODB_URL || "",
    },
    storageType: process.env.STORAGE_TYPE || "oss",
    s3: {
        endPoint: process.env.S3_ENDPOINT || "",
        region: process.env.S3_REGION || "",
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        bucketName: process.env.S3_BUCKET_NAME || "",
        filesBucketName: process.env.S3_FILES_BUCKET_NAME || "",
    },
    oss: {
        endPoint: process.env.OSS_ENDPOINT || "",
        region: process.env.OSS_REGION || "",
        accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.OSS_SECRET_ACCESS_KEY || "",
        bucketName: process.env.OSS_BUCKET_NAME || "",
        filesBucketName: process.env.OSS_FILES_BUCKET_NAME || "",
    },
    documentService: {
        host: process.env.DOCUMENT_SERVICE_HOST || "",
    },
    redis: {
        address: process.env.REDIS_ADDRESS || "",
        password: process.env.REDIS_PASSWORD || "",
        db: Number(process.env.REDIS_DB) || 0,
        sentinel: process.env.REDIS_SENTINEL === "true",
        sentinelAddrs: JSON.parse(process.env.REDIS_SENTINEL_ADDRS || "[]") as string[],
        masterName: process.env.REDIS_MASTER_NAME || "",
    },
}
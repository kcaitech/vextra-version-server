import { Collection, Document, MongoClient } from "mongodb"
import { getConfig } from "../config"

let mongoDBClient: MongoClient
async function connect() {
    try {
        mongoDBClient = await MongoClient.connect(getConfig().mongo.url, {
            // useBigInt64: true,
        })
    } catch (err) {
        console.log("mongodb连接失败", err)
        throw err
    }
}

// let connected = false;
let _documentCollection: Collection<Document>
export async function mongodb() {
    if (!_documentCollection) {
        await connect();
        const mongoDB = mongoDBClient.db(getConfig().mongo.db)
        _documentCollection = mongoDB.collection("document")
    }
    return _documentCollection;
}
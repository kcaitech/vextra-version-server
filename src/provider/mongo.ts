import { Collection, Document, MongoClient } from "mongodb"
import { getConfig } from "../config"

let mongoDBClient: MongoClient
async function connect() {
    try {
        const url = getConfig().mongo.url
        console.log("connect mongo url:", url)
        mongoDBClient = await MongoClient.connect(url)
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
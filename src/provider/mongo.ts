/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
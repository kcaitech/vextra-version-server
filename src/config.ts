/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


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
    console.log("config", JSON.stringify(_config))
}

export function getConfig() {
    if (!_config) {
        throw new Error("config not initialized")
    }
    return _config;
}

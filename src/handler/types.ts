/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export type DocumentInfo = {
    id: string
    path: string
    version_id: string
    last_cmd_id: string
}

export type CmdItem = {
    baseVer: number;
    batchId: string;
    batchLength: number;
    batchStart: number;
    dataFmtVer: string;
    description: string;
    documentId: string;
    id: string;
    isRecovery: boolean;
    ops: any[]; // 具体类型可根据实际情况替换
    posttime: string;
    time: string;
    userId: string;
    version: number;
}

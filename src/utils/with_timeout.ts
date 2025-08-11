/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string = 'timeout'): Promise<T> {

    let _timeout_id: NodeJS.Timeout

    const timeoutPromise = new Promise<T>((_, reject) => {
            _timeout_id = setTimeout(() => {
            reject(new Error(errorMsg))
        }, timeoutMs)
    })

    const taskPromise = promise.then(
        result => {
            clearTimeout(_timeout_id)
            return result
        },
        error => {
            clearTimeout(_timeout_id)
            throw error
        }
    )

    return Promise.race([taskPromise, timeoutPromise])
}
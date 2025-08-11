/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

type FunType = (...args: any[]) => Promise<any>
let funList: FunType[] = []

export function addFun(fun: FunType) {
    funList.push(fun)
}

export function removeFun(fun: FunType) {
    funList = funList.filter(f => f !== fun)
}

let first = true
export async function exit(code: number = 0) {
    if (!first) return;
    first = false
    const funListRes = Promise.all(funList.map(f => f().catch()))
    const timeout = new Promise<void>(resolve => setTimeout(() => resolve(), 10000))
    await Promise.race([funListRes, timeout])
    if (!Number.isInteger(code)) code = 0;
    process.exit(code)
}

process.on("SIGINT", exit)
process.on("SIGTERM", exit)
process.on("beforeExit", exit)
process.on("exit", exit)

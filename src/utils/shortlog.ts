/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


export function shortLog() {
    // 截断太长的log
    const _commonlog = console.log;
    const _shortlog = (...args: any[]) => {
        // 把异常打印出来
        for (let i = 0; i < args.length; ++i) {
            if (args[i] instanceof Error) return _commonlog(...args);
        }
        const max_count = 5
        const max_length = 128
        for (let i = 0; i < args.length && i < max_count; ++i) {
            const str = JSON.stringify(args[i])
            if (str.length < max_length) {
                _commonlog(args[i])
                continue
            }
            if (!Array.isArray(args[i])) {
                _commonlog(str.substring(0, max_length) + '...')
                continue
            }
            // array
            const arr: Array<any> = args[i]
            if (arr.length <= max_count) {
                _commonlog(arr)
                continue
            } else {
                _commonlog(arr.slice(0, max_count))
                _commonlog(`    ... ${arr.length - max_count} more`)
            }
        }
        if (args.length > max_count) {
            _commonlog(`... ${args.length - max_count} more`)
        }
    };
    console.log = _shortlog
}

export function shortLog() {
    // 截断太长的log
    const _commonlog = console.log;
    const _silentlog = (...args: any[]) => {
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
            _commonlog(args[i][0])
            if (args[i].length > 1) {
                _commonlog(`    ... ${args[i].length - 1} more`)
            }
        }
        if (args.length > max_count) {
            _commonlog(`... ${args.length - max_count} more`)
        }
    };
    console.log = _silentlog
}
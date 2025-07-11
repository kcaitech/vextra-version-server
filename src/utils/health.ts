const _start_time = Date.now()
const _max_request_count = 1000
const _max_timeout_count = 5
const _max_health_time = 1000 * 60 * 60 * 72 // 三天重启一次
const _timeout_ms = 1000 * 60 * 15

let _request_count = 0
let _timeout_count = 0

let _request_handling = 0

function incRequestHandling() {
    _request_handling++
}

function decRequestHandling() {
    _request_handling--
    if (_request_handling > 0) {
        return
    }
    if (!isHealth()) {
        console.warn(`health check will restart,
            _request_count: ${_request_count},
            _timeout_count: ${_timeout_count},
            _request_handling: ${_request_handling},
            _start_time: ${_start_time},
            already running: ${(Date.now() - _start_time) / (1000 * 60 * 60 * 24)} days`)
        process.exit(1)
    }
    if (_request_handling < 0) {
        console.error(`_request_handling < 0, _request_handling: ${_request_handling}`)
        _request_handling = 0
    }
}

function incTimeoutCount() {
    _timeout_count++
}

function resetTimeoutCount() {
    _timeout_count = 0
}

function incRequestCount() {
    _request_count++
}

export function isHealth() {
    return _timeout_count < _max_timeout_count && _request_count < _max_request_count && Date.now() - _start_time < _max_health_time
}

export function handleWithTimeout<T>(promise: Promise<T>): Promise<T> {
    incRequestCount()
    incRequestHandling()

    let _timeout_id: NodeJS.Timeout

    const timeoutPromise = new Promise<T>((_, reject) => {
        _timeout_id = setTimeout(() => {
            incTimeoutCount()
            reject(new Error("timeout"))
        }, _timeout_ms)
    })

    const taskPromise = promise.then(
        result => {
            resetTimeoutCount()
            clearTimeout(_timeout_id)
            return result
        },
        error => {
            clearTimeout(_timeout_id)
            throw error
        }
    )

    return Promise.race([taskPromise, timeoutPromise]).finally(() => {
        decRequestHandling()
    })
}
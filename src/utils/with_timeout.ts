export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {

    let _timeout_id: NodeJS.Timeout

    const timeoutPromise = new Promise<T>((_, reject) => {
            _timeout_id = setTimeout(() => {
            reject(new Error("timeout"))
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
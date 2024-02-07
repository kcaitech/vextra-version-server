// YYYY-MM-DD HH:mm:ss.sss
export function getDateTimeWithMs() {
    const now = new Date()
    const Y: string = now.getFullYear().toString().padStart(4, "0")
    const M: string = (now.getMonth() + 1).toString().padStart(2, "0")
    const D: string = now.getDate().toString().padStart(2, "0")
    const H: string = now.getHours().toString().padStart(2, "0")
    const m: string = now.getMinutes().toString().padStart(2, "0")
    const s: string = now.getSeconds().toString().padStart(2, "0")
    const ms: string = now.getMilliseconds().toString().padStart(3, "0")
    return `${Y}-${M}-${D} ${H}:${m}:${s}.${ms}`
}

// YYYY-MM-DD
export function getDate() {
    return getDateTimeWithMs().slice(0, 10)
}

// HH:mm:ss
export function getTime() {
    return getDateTimeWithMs().slice(11, 19)
}

// HH:mm:ss.sss
export function getTimeWithMs() {
    return getDateTimeWithMs().slice(11, 23)
}

// 毫秒时间戳
export function getTimestamp() {
    return Date.now()
}

// YYYY-MM-DD HH:mm:ss
export function getDateTime() {
    return getDate() + " " + getTime()
}

// YYYYMMDDHHmmss
export function getYMDHMS() {
    return getDateTime().replace(/[-: ]/g, "")
}

// YYYYMMDDHHmmsssss
export function getYMDHMSS() {
    return getDateTimeWithMs().replace(/[-: .]/g, "")
}

export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

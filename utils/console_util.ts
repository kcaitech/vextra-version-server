import util from "util"
import * as times_utils from "./times_util"

export enum ConsoleType {
    log = "log",
    error = "error",
    debug = "debug",
    info = "info",
    warn = "warn",
}
const ConsoleTypeList = ["log", "error", "debug", "info", "warn"]

type ConsoleTypeStr = keyof typeof ConsoleType
type ConsoleSetting = {
    enable: boolean,
}

const Setting: Record<ConsoleTypeStr, ConsoleSetting> = {
    log: {
        enable: true,
    },
    error: {
        enable: true,
    },
    debug: {
        enable: true,
    },
    info: {
        enable: true,
    },
    warn: {
        enable: true,
    },
}

export function enableConsole(type: ConsoleTypeStr) {
    Setting[type].enable = true
}

export function enableAllConsole() {
    for (const item of ConsoleTypeList) {
        enableConsole(item as ConsoleTypeStr)
    }
}

export function disableConsole(type: ConsoleTypeStr) {
    Setting[type].enable = false
}

export function disableAllConsole() {
    for (const item of ConsoleTypeList) {
        disableConsole(item as ConsoleTypeStr)
    }
}

export function objectToStr(options?: {
    beforeHandler?: (type: ConsoleTypeStr, content: string) => boolean,
    handler?: (type: ConsoleTypeStr, content: string) => void,
}) {
    const c = console as any
    for (const item of ConsoleTypeList) {
        const originalConsole = c[item]
        c[item] = function (...args: any[]) {
            const setting = Setting[item as ConsoleTypeStr]
            if (!setting.enable) return;
            const content = args.map(item => typeof item === "object" ? util.inspect(item, true, null, false) : item).join(" ")
            if (options?.beforeHandler && !options.beforeHandler(item as ConsoleTypeStr, content)) return;
            const nowFormat = times_utils.getDateTimeWithMs()
            originalConsole.call(console, nowFormat, ...args.map(item => typeof item === "object" ? util.inspect(item, true, null, false) : item))
            if (options?.handler) options.handler(item as ConsoleTypeStr, content);
        }
    }
}

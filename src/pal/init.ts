import {initModule} from "@kcdesign/data"
import {getTextPath} from "./textpath"
import {measure} from "./measure"

let isInitialized: boolean = false

export async function init() {
    if (isInitialized) return;

    initModule(measure, getTextPath)

    isInitialized = true
}

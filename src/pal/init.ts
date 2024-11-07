import * as boolop from "./pathop"
import {IPalPath, gPal} from "@kcdesign/data"
import {getTextPath} from "./textpath"
import {measure} from "./measure"

let isInitialized: boolean = false

export async function init() {
    if (isInitialized) return;

    await boolop.init()
    gPal.boolop = boolop

    gPal.text.getTextPath = getTextPath
    gPal.text.textMeasure = measure

    gPal.makePalPath = (path: string): IPalPath => {
        return new boolop.PalPath(path)
    }

    isInitialized = true
}

import { initModule as initDataModule } from "@kcdesign/data"
import { text2path } from "./text2path"
import { measure } from "./measure"
import { Path2D, Canvas, Image, DOMMatrix } from "skia-canvas"

let isInitialized: boolean = false

export async function initModule() {
    if (isInitialized) return;

    initDataModule(measure, text2path, {
        Path2D: Path2D,
        OffscreenCanvas: Canvas as any,
        Image: Image,
        DOMMatrix: DOMMatrix,
    })

    isInitialized = true
}

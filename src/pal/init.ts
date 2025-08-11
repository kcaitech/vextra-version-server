/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { initModule as initDataModule } from "@kcaitech/vextra-core"
import { text2path } from "./text2path"
import { measure } from "./measure"
import { Path2D, Canvas, Image, DOMMatrix } from "skia-canvas"

let isInitialized: boolean = false

export async function initModule() {
    if (isInitialized) return;

    initDataModule(measure, text2path, {
        Path2D: Path2D as any,
        OffscreenCanvas: Canvas as any,
        Image: Image as any,
        DOMMatrix: DOMMatrix as any,
    })

    isInitialized = true
}

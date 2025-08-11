/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {Canvas} from "skia-canvas"

const ctx = new Canvas().getContext("2d")

function measureText(text: string, font: string): TextMetrics {
    ctx.font = font
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    return ctx.measureText(text)
}

// 等宽字符集
function isEqualWidthCode(code: number): boolean {
    return code >= 0x4E00 && code <= 0x9FA5 // 基本汉字	20902字
        || code >= 0x2E80 && code <= 0xA4CF
        || code >= 0xF900 && code <= 0xFAFF
        || code >= 0xFE30 && code <= 0xFE4F;
}

function isAsciiCode(code: number) {
    return code <= 0xff && code >= 0;
}

// measure equal width code cache
const _mEWCCache: { [key: string]: TextMetrics | undefined } = {};
const _mAsciiCache: { [key: string]: { [key: string]: TextMetrics | undefined } } = {};
const _tabMetrics = new class implements TextMetrics {
    actualBoundingBoxAscent: number = 28; // textBaseline 属性标明的水平线到渲染文本的矩形边界顶部的距离。多字测量是啥？
    actualBoundingBoxDescent: number = 0; // textBaseline 属性标明的水平线到渲染文本的矩形边界底部的距离
    actualBoundingBoxLeft: number = 0; // textAlign 属性确定的对齐点到文本矩形边界左侧的距离。左对齐这里应该为0
    actualBoundingBoxRight: number = 28; // textAlign 属性确定的对齐点到文本矩形边界右侧的距离。左对齐这里应该为字方框的宽度。
    fontBoundingBoxAscent: number = 28; // textBaseline 属性标明的水平线到渲染文本的所有字体的矩形最高边界顶部的距离。单字测量时同actualBoundingBoxAscent
    fontBoundingBoxDescent: number = 0; // textBaseline 属性标明的水平线到渲染文本的所有字体的矩形边界最底部的距离
    width: number = 28; // 字符串的宽度
    hangingBaseline: number = 28; // textBaseline 属性标明的水平线到线框的 hanging 基线的距离
    alphabeticBaseline: number = 0; // textBaseline 属性标明的水平线到线框的 alphabetic 基线的距离。textBaseline为alphabetic时这里为0
    emHeightAscent: number = 28; // textBaseline 属性标明的水平线到线框中 em 方块顶部的距离
    emHeightDescent: number = 0; // textBaseline 属性标明的水平线到线框中 em 方块底部的距离
    ideographicBaseline: number = 0; // textBaseline 属性标明的水平线到线框的 ideographic 基线的距离
}


export function measure(text: string, font: string) {
    // font = (italic ? 'italic ' : '') + weight + ' ' + fontSize + 'px ' + font;
    const code = text.charCodeAt(0);
    if (isAsciiCode(code)) {
        if (code === 0x09) return _tabMetrics; // '\t'
        let cache: { [key: string]: TextMetrics | undefined } = _mAsciiCache[font];
        if (!cache) {
            cache = {}
            _mAsciiCache[font] = cache;
        }
        let m = cache[code];
        if (!m) {
            m = measureText(String.fromCharCode(code), font);
            cache[code] = m;
        }
        return m;
    }
    if (isEqualWidthCode(code)) {
        let m: TextMetrics | undefined = _mEWCCache[font];
        if (!m) {
            m = measureText(String.fromCharCode(code), font);
            _mEWCCache[font] = m;
        }
        return m;
    }
    return measureText(text, font);
}
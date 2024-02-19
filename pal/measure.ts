import {Canvas} from "skia-canvas"

const ctx = new Canvas().getContext("2d")

function measureText(text: string, font: string): TextMetrics {
    ctx.font = font
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
    actualBoundingBoxAscent: number = 0;
    actualBoundingBoxDescent: number = 0;
    actualBoundingBoxLeft: number = 0;
    actualBoundingBoxRight: number = 0;
    fontBoundingBoxAscent: number = 0;
    fontBoundingBoxDescent: number = 0;
    width: number = 28;
}

export function measure(code: number, font: string) {
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
    return measureText(String.fromCharCode(code), font);
}

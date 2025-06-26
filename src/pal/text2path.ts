import { Canvas } from "skia-canvas"
import { Path } from "@kcdesign/data";

const textPathCache: Map<string, string> = new Map()
export function text2path(font: string, fontSize: number, italic: boolean, weight: number, charCode: number) {
    fontSize = Math.round(fontSize)

    const cacheId = font + "#" + fontSize + "#" + charCode + (italic ? '#i' : '') + '#' + weight;
    let path = textPathCache.get(cacheId)
    if (path) return path;

    const size = Math.round(fontSize * 1.25);
    // const width = fontSize
    // const height = Math.round(fontSize * 1.1)

    const canvas = new Canvas(size, size)
    const ctx = canvas.getContext("2d")
    ctx.imageSmoothingEnabled = false

    ctx.font = `${fontSize}px ${font}`
    ctx.fillStyle = "black"
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"

    const offsetX = Math.round(fontSize * 0.1); // j会左边截断
    ctx.fillText(String.fromCharCode(charCode), offsetX, fontSize)

    const svgData = canvas.toBufferSync("svg", { outline: true })

    const pathReg = /d="(.*)"/
    const regRes = pathReg.exec(svgData.toString())
    if (!regRes) return "";
    path = regRes[1]

    // 还要进行偏移下
    const _path = new Path(path);
    _path.translate(-offsetX, -fontSize);

    const ret = _path.toString();
    textPathCache.set(cacheId, ret)
    return ret
}

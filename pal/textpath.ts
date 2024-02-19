import {Canvas} from "skia-canvas"

const textPathCache: Map<string, string> = new Map()
export function getTextPath(font: string, fontSize: number, charCode: number) {
    fontSize = Math.round(fontSize)

    const cacheId = font + "#" + fontSize + "#" + charCode
    let path = textPathCache.get(cacheId)
    if (path) return path;

    const width = fontSize
    const height = Math.round(fontSize * 1.1)

    const canvas = new Canvas(width, height)
    const ctx = canvas.getContext("2d")
    ctx.imageSmoothingEnabled = false

    ctx.font = `${fontSize}px ${font}`
    ctx.fillStyle = "black"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(String.fromCharCode(charCode), 0, 0)

    const svgData = canvas.toBufferSync("svg", { outline: true })

    const pathReg = /d="(.*)"/
    const regRes = pathReg.exec(svgData.toString())
    if (!regRes) return "";
    path = regRes[1]
    textPathCache.set(cacheId, path)
    return path
}

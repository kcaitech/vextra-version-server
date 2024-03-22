import * as boolop from "./pathop"
import { Canvas, Path2D } from "skia-canvas"
import * as fs from "fs"
import {measure} from "./measure"

const path1 = `
    M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z`

const path2 = `
    M 50 50 L 150 50 L 150 150 L 50 150 L 50 50 Z`

async function testPath() {
    const canvas = new Canvas(500, 500)
    const ctx = canvas.getContext("2d")

    await boolop.init()
    const res = boolop.union(path1, path2)
    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.fill(new Path2D(res))
    ctx.closePath()

    const pngData = canvas.toBufferSync("png")
    fs.writeFileSync("testPath.png", pngData)
}

// testPath()

function testTextToPath(font: string, fontSize: number, charCode: number) {
    fontSize = Math.round(fontSize)

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

    const pngData = canvas.toBufferSync("png", { outline: true })
    fs.writeFileSync("testTextToPath.png", pngData)

    const svgData = canvas.toBufferSync("svg", { outline: true })
    fs.writeFileSync("testTextToPath.svg", svgData)

    const pathReg = /d="(.*)"/
    const regRes = pathReg.exec(svgData.toString())
    if (!regRes) throw new Error("can not find path in svg data");
    const path = regRes[1]
    console.log(path)
}

testTextToPath("宋体", 16, "啊".codePointAt(0)!)

function testMeasure() {
    const res = measure("g", "16px 宋体")
    console.log(res)
}

// testMeasure()

import {createCanvas, loadImage} from "canvas"
import fs from "fs"
import path from "path"

(async () => {
    const start = Date.now()
    console.log("begin")
    const image = await loadImage("../page.svg")
    console.log("end", Date.now() - start + "ms")

    const width = image.width
    const height = image.height
    console.log(`width: ${width}, height: ${height}`)

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(image, 0, 0, width, height)
    const buffer = canvas.toBuffer("image/png")
    console.log("end2", Date.now() - start + "ms")

    fs.writeFileSync(path.join(__dirname, "page.png"), buffer)
})()

import sharp from "sharp"
import fs from "fs"
import path from "path"

async function convertSvgToPng(): Promise<void> {
    try {
        const svg = fs.readFileSync(path.join(__dirname, "../page.svg"))
        const svgString = svg.toString()
        fs.writeFileSync(path.join(__dirname, "svgString.txt"), svgString)
        const s = sharp(Buffer.from(svgString))
        const start = Date.now()
        console.log("begin")
        const pngBuffer = await s.png().toBuffer()
        console.log("end", Date.now() - start + "ms")
        fs.writeFileSync(path.join(__dirname, "page.png"), pngBuffer)
    } catch (err) {
        console.error("svg to png转换失败", err)
    }
}

async function convertSvgStringToPng(): Promise<void> {
    try {
        const svgString = fs.readFileSync(path.join(__dirname, "svgString.txt")).toString()
        const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer()
        fs.writeFileSync(path.join(__dirname, "page2.png"), pngBuffer)
    } catch (err) {
        console.error("svg to png转换失败", err)
    }
}

convertSvgToPng()
// convertSvgStringToPng()

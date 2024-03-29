import puppeteer from "puppeteer"
import fs from "fs"
import path from "path"
import * as exit_util from "../../../utils/exit_util"
import * as times_util from "../../../utils/times_util"

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--font-render-hinting=none",
        ],
    })
    const page = (await browser.pages())[0]

    await times_util.sleepAsync(3000)

    const start = Date.now()
    console.log("begin")

    const svgPath = path.join(__dirname, "../page.svg")
    try {
        await page.goto("file://" + svgPath)
    } catch (err) {
        console.log("文件打开失败", err)
        await exit_util.exit()
    }

    const buffer = await page.screenshot({
        path: "../page.png",
        fullPage: true,
        omitBackground: true,
    })
    fs.writeFileSync(path.join(__dirname, "page.png"), buffer)

    console.log("end", Date.now() - start + "ms")

    await browser.close()
})()

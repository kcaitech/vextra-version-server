import { IO, Page, TransactDataGuard } from "@kcdesign/data"
import { getImageRefList } from "./handler/generate";
import * as times_util from "./utils/times_util"
import { DocumentInfo } from "./handler/types";
import { storage } from "./provider/storage";


type ReviewResult = { documentInfo: DocumentInfo, documentData: IO.ExFromJson, documentText: string, mediasSize: number, pageSvgs: string[] }

export async function reviewDocumentData(documentInfo: DocumentInfo): Promise<{ result?: ReviewResult, err?: string }> {
    const _storage = await storage();
    const repo = new TransactDataGuard()
    const d = await IO.importRemote(_storage, documentInfo.path, "", documentInfo.version_id, repo)
    const document = d.document

    // 导出page图片
    const pageList: Page[] = []
    const imageRefList: string[] = []
    for (const _page of document.pagesList) {
        const page = await document.pagesMgr.get(_page.id);
        if (!page) continue;
        pageList.push(page)
        imageRefList.push(...getImageRefList(Array.from(page.shapes.values())))
    }
    const imageAllLoadPromise = Promise.allSettled(imageRefList.map(ref => document.mediasMgr.get(ref))).catch(err => { })
    const timeoutPromise = times_util.sleepAsync(1000 * 60)
    await Promise.race([imageAllLoadPromise, timeoutPromise])

    const pageSvgs = pageList.map(page => IO.exportSvg(page))
    try {
        const documentData = await IO.exportExForm(document)

        let mediasSize = 0
        for (let i = 0, len = documentData.media_names.length; i < len; i++) {
            const buffer = await document.mediasMgr.get(documentData.media_names[i])
            if (buffer !== undefined) mediasSize += buffer.buff.byteLength;
        }
        const documentText = await document.getText()
        return { result: { documentInfo, documentData, documentText, mediasSize, pageSvgs } }

    } catch (err) {
        const msg = `[${documentInfo.id}]generateNewVersion错误：上传错误`
        console.log(msg, err)
        return { err: msg }
    }
}
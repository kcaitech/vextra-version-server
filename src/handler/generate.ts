import { Page, TransactDataGuard, Repo, IO, Shape } from "@kcdesign/data";
import { CmdItem, DocumentInfo } from "./types";
import { storage } from "../provider/storage";
import { mongodb } from "../provider/mongo";
import { Cmd, CoopRepository, INet, parseCmds } from "@kcdesign/coop";
import path from "path";
import fs from "fs";
import { Canvas } from "skia-canvas";
import { withTimeout } from "../utils/with_timeout";

async function findCmdItem(documentId: string, startCmdId?: number, endCmdId?: number): Promise<CmdItem[]> {
    const documentCollection = await mongodb();
    if (startCmdId === undefined && endCmdId === undefined) return Promise.resolve([]);
    const findQuery: any = {
        document_id: documentId,
        ver_id: {},
    }
    if (startCmdId !== undefined) findQuery.ver_id["$gte"] = startCmdId;
    if (endCmdId !== undefined) findQuery.ver_id["$lte"] = endCmdId;
    if (startCmdId === undefined && endCmdId === undefined) delete findQuery.ver_id;
    const findCursor = documentCollection.find(findQuery, { sort: { ver_id: 1 } })
    return await findCursor.toArray() as any as CmdItem[]
}

function parseCmdList(cmdItemList: CmdItem[]): Cmd[] {
    return parseCmds(cmdItemList.map(cmdItem => {
        const cmd: Cmd = {
            id: cmdItem.id,
            ops: cmdItem.ops,
            version: cmdItem.version,
            baseVer: cmdItem.baseVer,
            batchId: cmdItem.batchId,
            isRecovery: cmdItem.isRecovery,
            description: cmdItem.description,
            time: Number(cmdItem.time),
            posttime: Number(cmdItem.posttime),
            dataFmtVer: cmdItem.dataFmtVer
        };
        return cmd
    }))
}


class CoopNet implements INet {
    private documentId: string
    constructor(documentId: string) {
        this.documentId = documentId
    }

    hasConnected(): boolean {
        return true;
    }
    async pullCmds(from: number, to: number): Promise<Cmd[]> {
        const startCmdId = from ? (from) : 0
        const endCmdId = to ? (to) : undefined
        const cmdItemList = await findCmdItem(this.documentId, startCmdId, endCmdId)
        return parseCmdList(cmdItemList)
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }
    watchCmds(watcher: (cmds: Cmd[]) => void): () => void {
        return () => { };
    }

    watchError(watcher: (errorInfo: any) => void): void {

    }
}

function saveFile(
    fileName: string,
    localPath: string,
    data: Uint8Array,
): string {
    const fullPath = path.join(localPath, fileName);
    // Ensure local path exists
    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }
    fs.writeFileSync(fullPath, data);
    return fullPath;
}

type GenResult = { documentInfo: DocumentInfo, lastCmdVerId: string, documentData: IO.ExFromJson, documentText: string, mediasSize: number, pages_png_generated: string[] }

export async function generate(documentInfo: DocumentInfo, cmdItemList: CmdItem[], gen_pages_png?: { tmp_dir: string }): Promise<{ result?: GenResult, err?: string }> {
    const cmdList = parseCmdList(cmdItemList)

    const _storage = await storage();
    const repo = new TransactDataGuard()
    const d = await IO.importRemote(_storage, documentInfo.path, "", documentInfo.version_id, repo)
    const document = d.document

    const coopRepo = new CoopRepository(document, repo)
    coopRepo.setNet(new CoopNet(documentInfo.id))
    coopRepo.setBaseVer(Number(documentInfo.last_cmd_id))
    try {
        const p = new Promise<void>((resolve, reject) => {
            coopRepo.onProcessedReceiveCmds(() => {
                resolve()
            })
            coopRepo.receive(cmdList)
        })
        await withTimeout(p, 1000 * 10, "coopRepo.receive超时")
    } catch (err) {
        const msg = `[${documentInfo.id}]generateNewVersion错误：coopRepo.receive错误`
        console.log(msg, err)
        return { err: msg }
    } finally {
        coopRepo.quit() // 需要退出
    }

    const pageList: Page[] = []
    const imageRefList: string[] = []
    for (const _page of document.pagesList) {
        const page = await document.pagesMgr.get(_page.id);
        if (!page) continue;
        pageList.push(page)
        imageRefList.push(...getImageRefList(Array.from(page.shapes.values())))
    }
    const imageAllLoadPromise = Promise.allSettled(imageRefList.map(ref => document.mediasMgr.get(ref))).catch(err => { })
    await withTimeout(imageAllLoadPromise, 1000 * 60, "imageAllLoadPromise超时")

    // 导出page图片
    const pages_png_generated: string[] = []
    if (gen_pages_png) {
        const tmp_dir = gen_pages_png.tmp_dir
        await Promise.all(pageList.map(async (page) => {
            const tmp_file_name = page.id + ".png"
            const canvas = await IO.exportImg(page) as unknown as Canvas;
            const png = await canvas.png
            saveFile(tmp_file_name, tmp_dir, new Uint8Array(png))
            pages_png_generated.push(tmp_file_name)
        }))
    }

    try {
        const documentData = await IO.exportExForm(document)
        const lastCmdVerId = cmdItemList[cmdItemList.length - 1].version.toString(10)
        let mediasSize = 0
        for (let i = 0, len = documentData.media_names.length; i < len; i++) {
            const buffer = await document.mediasMgr.get(documentData.media_names[i])
            if (buffer !== undefined) mediasSize += buffer.buff.byteLength;
        }
        const documentText = await document.getText()
        return { result: { documentInfo, lastCmdVerId, documentData, documentText, mediasSize, pages_png_generated } }
    } catch (err) {
        const msg = `[${documentInfo.id}]generateNewVersion错误：上传错误`
        console.log(msg, err)
        return { err: msg }
    }
}

export function getImageRefList(shapes: Shape[]): string[] {
    const imageRefList: string[] = []
    for (const shape of shapes) {
        if (shape.style.fills.length > 0) {
            for (const fill of shape.style.fills) {
                if (fill.imageRef) {
                    imageRefList.push(fill.imageRef)
                }
            }
        }
    }
    return imageRefList
}

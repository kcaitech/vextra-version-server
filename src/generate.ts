import { Cmd, CoopRepository, ExFromJson, exportExForm, exportSvg, ICoopNet, ImageShape, importDocument, Page, parseCmds, RadixConvert, Repository, ShapeType } from "@kcdesign/data";
import axios from "axios";
import { DocumentInfo } from "./basic";
import { mongodb } from "./mongo";
import { db } from "./mysql_db";
import FormData from "form-data"
import { storage } from "./storage";
import * as times_util from "./utils/times_util"
import config from "./config";
import * as console_util from "./utils/console_util"

async function getDocument(documentId: string): Promise<DocumentInfo | undefined> {
    const mysqlConn = await db();
    return new Promise<DocumentInfo | undefined>((resolve, reject) => {
        mysqlConn.query(`select d.id, d.path, d.version_id, dv.last_cmd_id
from document d
inner join document_version dv on dv.document_id=d.id and dv.version_id=d.version_id and dv.deleted_at is null
where d.id=${documentId} and d.deleted_at is null
limit 1`,
            (err, rows) => {
                if (err) reject(err);
                const _rows = rows as DocumentInfo[]
                resolve(_rows.length > 0 ? _rows[0] : undefined)
            },
        )
    })
}

type _Cmd = {
    baseVer: string,
    batchId: string,
    ops: any[],
    isRecovery: boolean,
    description: string,
    time: bigint,
    posttime: bigint,
}

type CmdItem = {
    _id: bigint
    previous_id: bigint
    batch_start_id: bigint
    batch_end_id: bigint
    batch_length: number
    document_id: bigint
    user_id: bigint
    cmd: _Cmd
    cmd_id: string
}

async function findCmdItem(documentId: bigint, startCmdId?: bigint, endCmdId?: bigint): Promise<CmdItem[]> {
    // let mongoDB = mongoDBClient.db("kcserver")
    const documentCollection = await mongodb();
    if (startCmdId === undefined && endCmdId === undefined) return Promise.resolve([]);
    const findQuery: any = {
        document_id: documentId,
        _id: {},
    }
    if (startCmdId !== undefined) findQuery._id["$gte"] = startCmdId;
    if (endCmdId !== undefined) findQuery._id["$lte"] = endCmdId;
    if (startCmdId === undefined && endCmdId === undefined) delete findQuery._id;
    const findCursor = documentCollection.find(findQuery, { sort: { _id: 1 } })
    return await findCursor.toArray() as any as CmdItem[]
}

function parseCmdList(cmdItemList: CmdItem[]): Cmd[] {
    return parseCmds(cmdItemList.map(cmdItem => {
        const cmd = cmdItem.cmd as any
        cmd.id = cmdItem.cmd_id
        cmd.version = radixRevert.from(cmdItem._id)
        cmd.previousVersion = radixRevert.from(cmdItem.previous_id)
        cmd.time = Number(cmd.time)
        cmd.posttime = Number(cmd.posttime)
        return cmd
    }))
}

const radixRevert = new RadixConvert(62)

class CoopNet implements ICoopNet {
    private documentId: bigint
    constructor(documentId: bigint) {
        this.documentId = documentId
    }
    hasConnected(): boolean {
        return true;
    }
    async pullCmds(from: string, to: string): Promise<Cmd[]> {
        const startCmdId = from ? radixRevert.to(from) : 0n
        const endCmdId = to ? radixRevert.to(to) : undefined
        const cmdItemList = await findCmdItem(this.documentId, startCmdId, endCmdId)
        return parseCmdList(cmdItemList)
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }
    watchCmds(watcher: (cmds: Cmd[]) => void): void {

    }

    watchError(watcher: (errorInfo: any) => void): void {

    }
}

async function svgToPng(svgContent: string): Promise<Buffer> {
    const svgBuffer = Buffer.from(svgContent, "utf-8")

    const form = new FormData()
    form.append("svg", svgBuffer, {
        filename: "image.svg",
        contentType: "image/svg+xml",
    })

    const response = await axios.post<Buffer>("http://svg-to-png.kc.svc.cluster.local:10050/svg_to_png", form, {
        headers: {
            ...form.getHeaders()
        },
        responseType: "arraybuffer",
        timeout: 1000 * 10,
    })
    if (response.status !== 200) {
        console.log("svgToPng错误", response.status, response.data)
        throw new Error("svgToPng错误")
    }

    return response.data
}

async function generateNewVersion(documentInfo: DocumentInfo): Promise<{documentInfo: DocumentInfo, lastCmdId: string, documentData: ExFromJson, documentText: string, mediasSize: number, pageImageBase64List: string[]} | undefined> {
    const cmdItemList = await findCmdItem(BigInt(documentInfo.id), BigInt(documentInfo.last_cmd_id) + 1n)
    const cmdList = parseCmdList(cmdItemList)
    if (cmdList.length === 0) {
        console.log(`[${documentInfo.id}]无新cmd，不需要生成新版本`)
        return
    }
    if (cmdList.length < config.min_cmd_count) {
        console.log(`[${documentInfo.id}]cmd数量小于${config.min_cmd_count}，不需要生成新版本`)
        return
    }
    const _storage = await storage();
    const repo = new Repository()
    const d = await importDocument(_storage, documentInfo.path, "", documentInfo.version_id, repo)
    const document = d.document

    const coopRepo = new CoopRepository(document, repo)
    coopRepo.setNet(new CoopNet(BigInt(documentInfo.id)))
    coopRepo.setBaseVer(radixRevert.from(documentInfo.last_cmd_id))

    // console_util.disableConsole(console_util.ConsoleType.log)
    try {
        const timeoutPromise = times_util.sleepAsyncReject(1000 * 10, new Error("coopRepo.receive超时"))
        const p = new Promise<void>((resolve, reject) => {
            coopRepo.setProcessCmdsTrigger(() => {
                resolve()
            })
            coopRepo.receive(cmdList)
        })
        await Promise.race([p, timeoutPromise])
    } catch (err) {
        console_util.enableConsole(console_util.ConsoleType.log)
        console.log(`[${documentInfo.id}]generateNewVersion错误：coopRepo.receive错误`, err)
        return
    }
    console_util.enableConsole(console_util.ConsoleType.log)

    // 导出page图片
    const pageList: Page[] = []
    const imageRefList: string[] = []
    for (const _page of document.pagesList) {
        const page = await document.pagesMgr.get(_page.id);
        if (!page) continue;
        pageList.push(page)
        imageRefList.push(...(Array.from(page.shapes.values())
            .filter(shape => shape.type === ShapeType.Image) as ImageShape[])
            .map(shape => shape.imageRef)
        )
    }
    const imageAllLoadPromise = Promise.allSettled(imageRefList.map(ref => document.mediasMgr.get(ref))).catch(err => { })
    const timeoutPromise = times_util.sleepAsync(1000 * 60)
    await Promise.race([imageAllLoadPromise, timeoutPromise])

    const pageImageBase64List: string[] = []
    for (const page of pageList) {
        try {
            const pageSvg = exportSvg(page)
            if (!pageSvg) continue;
            const pagePngBuffer = await svgToPng(pageSvg)
            pageImageBase64List.push(pagePngBuffer.toString("base64"))
        } catch (err) {
            console.log("导出page图片失败", err)
        }
    }

    try {
        const documentData = await exportExForm(document)

        const lastCmdId = cmdItemList[cmdItemList.length - 1]._id.toString(10)
        let mediasSize = 0
        for (let i = 0, len = documentData.media_names.length; i < len; i++) {
            const buffer = await document.mediasMgr.get(documentData.media_names[i])
            if (buffer !== undefined) mediasSize += buffer.buff.byteLength;
        }
        const documentText = await document.getText()

        return {documentInfo, lastCmdId, documentData, documentText, mediasSize, pageImageBase64List}

    } catch (err) {
        console.log(`[${documentInfo.id}]generateNewVersion错误：上传错误`, err)
        return
    }

}


export async function generate(documentId: string) {

    documentId = documentId + ""
    console.log("generate", documentId)

    const documentInfo = await getDocument(documentId)
    if (!documentInfo) {
        return
    }

    const result = await generateNewVersion(documentInfo)
    return result;
}
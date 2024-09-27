import { ExFromJson } from "@kcdesign/data"
import config from "./config"
import { DocumentInfo } from "./basic"

export async function upload(documentInfo: DocumentInfo, lastCmdId: string, documentData: ExFromJson, documentText: string, mediasSize: number, pageImageBase64List: string[]) {
    const ws = new WebSocket(config.uploadApi.url)
    await new Promise<void>((resolve, reject) => {
        ws.onopen = _ => resolve()
        ws.onerror = err => reject(err)
    })
    ws.binaryType = "arraybuffer"


    ws.send(JSON.stringify({
        document_id: documentInfo.id,
        last_cmd_id: lastCmdId,
    }))
    ws.send(JSON.stringify({
        ...documentData,
        medias_size: mediasSize,
        document_text: documentText,
        page_image_base64_list: pageImageBase64List,
    }))
    const versionId = await new Promise<string>((resolve, reject) => {
        let isClosed = false
        ws.onmessage = ((event) => {
            if (isClosed) return;
            try {
                const data = JSON.parse(event.data as string)
                const status = data.status
                const versionId = data.data?.version_id
                if (status !== "success" || !versionId) {
                    console.log(`[${documentInfo.id}]generateNewVersion错误：document upload fail`, data)
                    reject()
                    return
                }
                resolve(versionId)
            } catch (e) {
                console.log(`[${documentInfo.id}]generateNewVersion错误：document upload fail`, e)
                reject()
            }
            isClosed = true
            ws.close()
        })
        setTimeout(() => {
            if (isClosed) return;
            console.log(`[${documentInfo.id}]generateNewVersion错误：document upload timeout`)
            reject()
            isClosed = true
            ws.close()
        }, 1000 * 10)
    })

    return versionId
}
import { Request, Response } from "express";
import { CmdItem, DocumentInfo } from "./types";
import { generate } from "./generate";
import { handleWithTimeout } from "../utils/health";


export async function generate_handler(req: Request, res: Response) {
    const reqParams = req.body as {
        documentInfo: DocumentInfo,
        cmdItemList: CmdItem[],
        force?: boolean,
        gen_pages_png?: {
            tmp_dir: string,
        }
    };
    const documentInfo = reqParams.documentInfo;
    const cmdItemList = reqParams.cmdItemList;
    if (!documentInfo || !cmdItemList) {
        res.status(400).send("参数错误：缺少documentInfo或cmdItemList");
        return;
    }
    try {
        const { result, err } = await handleWithTimeout(generate(documentInfo, cmdItemList, !!reqParams.force, reqParams.gen_pages_png));
        if (result) {
            res.json(result);
        } else {
            res.status(202).send(err); // todo
        }
    } catch (error) {
        console.error(`[${documentInfo.id}] 生成处理器错误:`, error);
        res.status(500).send(error);
    }
}
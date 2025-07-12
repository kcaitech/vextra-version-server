import { Request, Response } from "express";
import { CmdItem, DocumentInfo } from "./types";
import { generate } from "./generate";
import { withTimeout } from "../utils/with_timeout";
import { HttpCode } from "./httpcode";


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
        res.status(HttpCode.StatusBadRequest).send("参数错误：缺少documentInfo或cmdItemList");
        return;
    }
    try {
        const generatePromise = generate(documentInfo, cmdItemList, !!reqParams.force, reqParams.gen_pages_png);
        const { result, err } = await withTimeout(generatePromise, 1000 * 60 * 10); // 10分钟超时
        if (result) {
            res.json(result);
        } else {
            res.status(HttpCode.StatusInternalServerError).send(err); // todo
        }
    } catch (error) {
        console.error(`[${documentInfo.id}] 生成处理器错误:`, error);
        res.status(HttpCode.StatusInternalServerError).send(error);
    }
}
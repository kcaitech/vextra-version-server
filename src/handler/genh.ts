import { Request, Response } from "express";
import { CmdItem, DocumentInfo } from "./types";
import { generate } from "./generate";


export async function generate_handler (req: Request, res: Response) {
    const reqParams = req.body as {
        documentInfo: DocumentInfo,
        cmdItemList: CmdItem[],
        force?: boolean,
        gen_png?: {
            tmp_dir: string,
            pages: {
                page_id: string,
                file_name: string,
            }[]
        }
    };
    const documentInfo = reqParams.documentInfo;
    const cmdItemList = reqParams.cmdItemList;
    if (!documentInfo || !cmdItemList) {
        res.status(400).send("参数错误：缺少documentInfo或cmdItemList");
        return;
    }

    const { result, err } = await generate(documentInfo, cmdItemList, !!reqParams.force, reqParams.gen_png);

    if (result) {
        res.json(result);
    } else {
        res.status(202).send(err); // todo
    }
}
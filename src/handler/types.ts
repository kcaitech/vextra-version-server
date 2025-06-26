export type DocumentInfo = {
    id: string
    path: string
    version_id: string
    last_cmd_id: string
}

export type CmdItem = {
    baseVer: number;
    batchId: string;
    batchLength: number;
    batchStart: number;
    dataFmtVer: string;
    description: string;
    documentId: string;
    id: string;
    isRecovery: boolean;
    ops: any[]; // 具体类型可根据实际情况替换
    posttime: string;
    time: string;
    userId: string;
    version: number;
}

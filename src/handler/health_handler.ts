import { Request, Response } from "express";
import { isHealth } from "../utils/health"

export async function health_handler(req: Request, res: Response) {
    if (isHealth()) {
        res.status(200).send("success")
    } else {
        res.status(500).send("Internal Server Error")
    }
}
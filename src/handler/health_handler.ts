import { Request, Response } from "express";

export async function health_handler(req: Request, res: Response) {
    res.status(200).send("success")
}
import type { Request, Response } from "express";
import { validateCode } from "./access.service.js";

export async function validateHandler(req: Request, res: Response) {
  const { code } = req.body ?? {};
  const data = await validateCode(code);
  res.json({ code: 0, message: "ok", data });
}

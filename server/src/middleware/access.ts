import type { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma.js";

export interface CodeInfo {
  id: number;
  code: string;
  maxTests: number | null;
  usedCount: number;
  status: string;
}

export interface CodeRequest extends Request {
  code?: CodeInfo;
}

export async function requireCode(req: CodeRequest, res: Response, next: NextFunction) {
  const raw = req.headers["x-access-code"];
  if (!raw) {
    res.status(401).json({ code: 40101, message: "请先输入激活码", data: null });
    return;
  }
  const record = await prisma.activationCode.findUnique({ where: { code: String(raw).trim() } });
  if (!record || record.status !== "ACTIVE") {
    res.status(401).json({ code: 40101, message: "激活码无效或已被禁用", data: null });
    return;
  }
  req.code = {
    id: record.id,
    code: record.code,
    maxTests: record.maxTests,
    usedCount: record.usedCount,
    status: record.status
  };
  next();
}

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.ADMIN_KEY;
  if (!configuredKey) {
    console.error("[admin] ADMIN_KEY is not configured; admin access is denied");
    res.status(500).json({ code: 50001, message: "ADMIN_KEY is not configured", data: null });
    return;
  }
  const key = req.headers["x-admin-key"];
  if (key !== configuredKey) {
    res.status(403).json({ code: 40301, message: "管理密钥错误", data: null });
    return;
  }
  next();
}

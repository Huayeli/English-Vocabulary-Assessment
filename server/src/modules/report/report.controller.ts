import type { Response } from "express";
import { prisma } from "../../utils/prisma.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { buildReport } from "./report.service.js";

export async function detailHandler(req: AuthRequest, res: Response) {
  const data = await buildReport(Number(req.params.sessionId), req.user!.userId, req.user!.role);
  res.json({ code: 0, message: "ok", data });
}

export async function listHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const [total, list] = await Promise.all([
    prisma.testSession.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.testSession.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  res.json({ code: 0, message: "ok", data: { list, total, page, pageSize } });
}

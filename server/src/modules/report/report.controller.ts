import type { Response } from "express";
import { prisma } from "../../utils/prisma.js";
import type { CodeRequest } from "../../middleware/access.js";
import { buildReport } from "./report.service.js";

export async function detailHandler(req: CodeRequest, res: Response) {
  const data = await buildReport(Number(req.params.sessionId), req.code!.id, false);
  res.json({ code: 0, message: "ok", data });
}

export async function listHandler(req: CodeRequest, res: Response) {
  const codeId = req.code!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const [total, list] = await Promise.all([
    prisma.testSession.count({ where: { activationCodeId: codeId, finishedAt: { not: null } } }),
    prisma.testSession.findMany({
      where: { activationCodeId: codeId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  res.json({ code: 0, message: "ok", data: { list, total, page, pageSize } });
}

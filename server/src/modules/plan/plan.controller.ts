import type { Response } from "express";
import { prisma } from "../../utils/prisma.js";

export async function listHandler(_req: unknown, res: Response) {
  const list = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  res.json({ code: 0, message: "ok", data: { list } });
}

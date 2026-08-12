import type { Response } from "express";
import type { Level } from "../../generated/prisma/enums.js";
import type { AuthRequest } from "../../middleware/auth.js";
import * as adminService from "./admin.service.js";

const LEVELS = new Set(["K1", "K2", "K3", "K5", "K10", "K10P"]);

function parseLevel(value: unknown): Level | undefined {
  if (typeof value === "string" && LEVELS.has(value)) return value as Level;
  return undefined;
}

export async function listUsersHandler(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const data = await adminService.listUsers({
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    packageCode: typeof req.query.package === "string" ? req.query.package : undefined,
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function userDetailHandler(req: AuthRequest, res: Response) {
  const data = await adminService.userDetail(Number(req.params.id));
  res.json({ code: 0, message: "ok", data });
}

export async function setPackageHandler(req: AuthRequest, res: Response) {
  const { packageId, expireTime, remainingTestCount } = req.body ?? {};
  const data = await adminService.setPackage(Number(req.params.id), {
    packageId: Number(packageId),
    expireTime: typeof expireTime === "string" ? expireTime : null,
    remainingTestCount: remainingTestCount === undefined ? undefined : Number(remainingTestCount)
  });
  res.json({ code: 0, message: "ok", data });
}

export async function listQuestionsHandler(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const data = await adminService.listQuestions({
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    level: parseLevel(req.query.level),
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function createQuestionHandler(req: AuthRequest, res: Response) {
  const { wordId, correctMeaningId, options } = req.body ?? {};
  const data = await adminService.createQuestion({
    wordId: Number(wordId),
    correctMeaningId: Number(correctMeaningId),
    options
  });
  res.json({ code: 0, message: "ok", data });
}

export async function updateQuestionHandler(req: AuthRequest, res: Response) {
  const { disabled, options } = req.body ?? {};
  const data = await adminService.updateQuestion(Number(req.params.id), { disabled, options });
  res.json({ code: 0, message: "ok", data });
}

export async function deleteQuestionHandler(req: AuthRequest, res: Response) {
  await adminService.deleteQuestion(Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}

export async function statsHandler(req: AuthRequest, res: Response) {
  const data = await adminService.statsOverview();
  res.json({ code: 0, message: "ok", data });
}

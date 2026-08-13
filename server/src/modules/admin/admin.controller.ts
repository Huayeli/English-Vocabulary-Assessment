import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";
import type { Level } from "../../generated/prisma/enums.js";

function pageParams(req: Request) {
  return {
    page: Math.max(1, Number(req.query.page) || 1),
    pageSize: Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
  };
}

export async function dashboardHandler(_req: Request, res: Response) {
  res.json({ code: 0, message: "ok", data: await adminService.dashboard() });
}

export async function listCodesHandler(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req);
  const data = await adminService.listCodes({
    batch: typeof req.query.batch === "string" ? req.query.batch : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function generateCodesHandler(req: Request, res: Response) {
  const { batchName, count, maxTests, note } = req.body ?? {};
  const data = await adminService.generateCodes({
    batchName,
    count: Number(count),
    maxTests: maxTests === "" || maxTests == null ? null : Number(maxTests),
    note
  });
  res.json({ code: 0, message: "ok", data });
}

export async function updateCodeHandler(req: Request, res: Response) {
  const { status, maxTests } = req.body ?? {};
  const data = await adminService.updateCode(Number(req.params.id), {
    status,
    maxTests: maxTests === "" || maxTests == null ? null : Number(maxTests)
  });
  res.json({ code: 0, message: "ok", data });
}

export async function batchCodesHandler(req: Request, res: Response) {
  const { ids, action, status, maxTests } = req.body ?? {};
  const data = await adminService.batchCodes(ids, action, {
    status,
    maxTests: maxTests === "" || maxTests == null ? null : Number(maxTests)
  });
  res.json({ code: 0, message: "ok", data });
}

export async function listBatchesHandler(_req: Request, res: Response) {
  res.json({ code: 0, message: "ok", data: await adminService.listBatches() });
}

export async function listTestsHandler(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req);
  const data = await adminService.listTests({
    type: typeof req.query.type === "string" ? req.query.type : undefined,
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function testDetailHandler(req: Request, res: Response) {
  res.json({ code: 0, message: "ok", data: await adminService.testDetail(Number(req.params.id)) });
}

const LEVELS = new Set(["K1", "K2", "K3", "K5", "K10", "K10P"]);

function parseLevel(value: unknown): Level | undefined {
  if (typeof value === "string" && LEVELS.has(value)) return value as Level;
  return undefined;
}

export async function listQuestionsHandler(req: Request, res: Response) {
  const { page, pageSize } = pageParams(req);
  const data = await adminService.listQuestions({
    keyword: typeof req.query.keyword === "string" ? req.query.keyword : undefined,
    level: parseLevel(req.query.level),
    page,
    pageSize
  });
  res.json({ code: 0, message: "ok", data });
}

export async function createQuestionHandler(req: Request, res: Response) {
  const { wordId, correctMeaningId, options } = req.body ?? {};
  const data = await adminService.createQuestion({
    wordId: Number(wordId),
    correctMeaningId: Number(correctMeaningId),
    options
  });
  res.json({ code: 0, message: "ok", data });
}

export async function updateQuestionHandler(req: Request, res: Response) {
  const { disabled, options } = req.body ?? {};
  const data = await adminService.updateQuestion(Number(req.params.id), { disabled, options });
  res.json({ code: 0, message: "ok", data });
}

export async function deleteQuestionHandler(req: Request, res: Response) {
  await adminService.deleteQuestion(Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}

import type { Response } from "express";
import type { CodeRequest } from "../../middleware/access.js";
import * as wrongWordService from "./wrong-word.service.js";
import { prisma } from "../../utils/prisma.js";
import { toClientQuestion } from "../question/question.service.js";

export async function listHandler(req: CodeRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const data = await wrongWordService.listWrongWords(req.code!.id, page, pageSize);
  res.json({ code: 0, message: "ok", data });
}

export async function removeHandler(req: CodeRequest, res: Response) {
  await wrongWordService.removeWrongWord(req.code!.id, Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}

export async function reviewHandler(req: CodeRequest, res: Response) {
  await wrongWordService.reviewWrongWord(req.code!.id, Number(req.params.id));
  res.json({ code: 0, message: "ok", data: null });
}

export async function firstQuestionOf(sessionId: number) {
  const item = await prisma.testSessionItem.findFirst({ where: { sessionId }, orderBy: { seq: "asc" } });
  if (!item) throw new Error("session has no items");
  const word = await prisma.word.findUniqueOrThrow({ where: { id: item.wordId } });
  const question = await prisma.question.findFirst({
    where: { wordId: item.wordId, disabled: false },
    include: { options: true }
  });
  if (!question) throw new Error("question not found");
  return toClientQuestion({ ...question, word }, 1, item.testedLevel);
}

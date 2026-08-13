import type { Response } from "express";
import type { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import type { CodeRequest } from "../../middleware/access.js";
import { answerQuestion, createSession, finishEarly, issueQuestion } from "./test.service.js";
import { getOrCreateQuestion, toClientQuestion } from "../question/question.service.js";

const LEVELS = new Set(["K1", "K2", "K3", "K5", "K10", "K10P"]);

function parseLevel(value: unknown): Level {
  if (typeof value === "string" && LEVELS.has(value)) return value as Level;
  throw new ApiError(40001, "无效的等级");
}

function assertCanTest(code: { maxTests: number | null; usedCount: number }) {
  if (code.maxTests != null && code.usedCount >= code.maxTests) {
    throw new ApiError(40302, "该激活码的测试次数已用完");
  }
}

export async function quotaHandler(req: CodeRequest, res: Response) {
  const code = req.code!;
  res.json({
    code: 0,
    message: "ok",
    data: {
      accessCode: code.code,
      usedCount: code.usedCount,
      maxTests: code.maxTests,
      remaining: code.maxTests == null ? null : Math.max(0, code.maxTests - code.usedCount)
    }
  });
}

async function startSession(
  req: CodeRequest,
  res: Response,
  type: "ADAPTIVE" | "VERIFICATION" | "WRONG_WORD",
  targetLevel?: Level
) {
  const code = req.code!;
  assertCanTest(code);
  let session;
  let level: Level = targetLevel ?? "K3";
  if (type === "WRONG_WORD") {
    session = await createWrongWordSessionService(code.id);
    const firstItem = await prisma.testSessionItem.findFirst({
      where: { sessionId: session.id },
      orderBy: { seq: "asc" }
    });
    if (!firstItem) throw new ApiError(50001, "错词测试生成失败");
    const word = await prisma.word.findUniqueOrThrow({ where: { id: firstItem.wordId } });
    const question = await getOrCreateQuestion(firstItem.wordId, firstItem.testedLevel);
    res.json({
      code: 0,
      message: "ok",
      data: {
        sessionId: session.id,
        totalQuestions: session.totalQuestions,
        currentLevel: firstItem.testedLevel,
        question: toClientQuestion({ ...question, word }, 1, firstItem.testedLevel)
      }
    });
    return;
  } else {
    session = await createSession(code.id, type, targetLevel);
  }
  const { item, question } = await issueQuestion(session.id, 1, targetLevel ?? "K3");
  const word = await prisma.word.findUniqueOrThrow({ where: { id: item.wordId } });
  res.json({
    code: 0,
    message: "ok",
    data: {
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      currentLevel: level,
      question: toClientQuestion({ ...question, word }, 1, level)
    }
  });
}

export async function startAdaptiveHandler(req: CodeRequest, res: Response) {
  await startSession(req, res, "ADAPTIVE");
}

export async function startVerificationHandler(req: CodeRequest, res: Response) {
  const level = parseLevel((req.body ?? {}).level);
  await startSession(req, res, "VERIFICATION", level);
}

export async function startWrongWordHandler(req: CodeRequest, res: Response) {
  await startSession(req, res, "WRONG_WORD");
}

export async function answerHandler(req: CodeRequest, res: Response) {
  const { optionIndex, answerTimeMs, seq } = req.body ?? {};
  const data = await answerQuestion(
    Number(req.params.sessionId),
    req.code!.id,
    Number(optionIndex),
    Number(answerTimeMs) || 0,
    seq == null ? undefined : Number(seq)
  );
  res.json({ code: 0, message: "ok", data });
}

export async function listHandler(req: CodeRequest, res: Response) {
  const codeId = req.code!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const where: Record<string, unknown> = { activationCodeId: codeId, finishedAt: { not: null } };
  if (type) where.type = type;
  const [total, list] = await Promise.all([
    prisma.testSession.count({ where }),
    prisma.testSession.findMany({ where, orderBy: { finishedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize })
  ]);
  res.json({ code: 0, message: "ok", data: { list, total, page, pageSize } });
}

export async function detailHandler(req: CodeRequest, res: Response) {
  const session = await prisma.testSession.findUnique({
    where: { id: Number(req.params.sessionId) },
    include: { items: { include: { word: true }, orderBy: { seq: "asc" } } }
  });
  if (!session || session.activationCodeId !== req.code!.id) throw new ApiError(40401, "测试不存在");
  res.json({ code: 0, message: "ok", data: session });
}

export async function abandonHandler(req: CodeRequest, res: Response) {
  const session = await prisma.testSession.findUnique({ where: { id: Number(req.params.sessionId) } });
  if (!session || session.activationCodeId !== req.code!.id) throw new ApiError(40401, "测试不存在");
  res.json({ code: 0, message: "ok", data: null });
}

export async function finishHandler(req: CodeRequest, res: Response) {
  const data = await finishEarly(Number(req.params.sessionId), req.code!.id);
  res.json({ code: 0, message: "ok", data });
}

import { createWrongWordSession as createWrongWordSessionService } from "../wrong-word/wrong-word.service.js";

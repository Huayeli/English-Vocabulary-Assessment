import type { Response } from "express";
import type { Level } from "../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import type { AuthRequest } from "../../middleware/auth.js";
import * as planService from "../plan/plan.service.js";
import { answerQuestion, createSession, issueQuestion } from "./test.service.js";
import { toClientQuestion } from "../question/question.service.js";
import { createWrongWordSession } from "../wrong-word/wrong-word.service.js";
import { firstQuestionOf } from "../wrong-word/wrong-word.controller.js";

const LEVELS = new Set(["K1", "K2", "K3", "K5", "K10", "K10P"]);

function parseLevel(value: unknown): Level {
  if (typeof value === "string" && LEVELS.has(value)) return value as Level;
  throw new ApiError(40001, "无效的等级");
}

export async function quotaHandler(req: AuthRequest, res: Response) {
  const data = await planService.getQuota(req.user!.userId);
  res.json({ code: 0, message: "ok", data });
}

export async function startAdaptiveHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  await planService.assertCanStartAdaptive(userId);
  const session = await createSession(userId, "ADAPTIVE");
  const { item, question } = await issueQuestion(session.id, 1, "K3" as Level);
  const word = await prisma.word.findUniqueOrThrow({ where: { id: item.wordId } });
  res.json({
    code: 0,
    message: "ok",
    data: {
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      currentLevel: "K3",
      question: toClientQuestion({ ...question, word }, 1, "K3" as Level)
    }
  });
}

export async function startVerificationHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const level = parseLevel((req.body ?? {}).level);
  await planService.assertFeature(userId, "verification");
  const session = await createSession(userId, "VERIFICATION", level);
  const { item, question } = await issueQuestion(session.id, 1, level);
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

export async function startWrongWordHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  await planService.assertFeature(userId, "wrongBook");
  const session = await createWrongWordSession(userId);
  const question = await firstQuestionOf(session.id);
  res.json({
    code: 0,
    message: "ok",
    data: {
      sessionId: session.id,
      totalQuestions: session.totalQuestions,
      currentLevel: question.testedLevel,
      question
    }
  });
}

export async function answerHandler(req: AuthRequest, res: Response) {
  const { optionIndex, answerTimeMs } = req.body ?? {};
  const data = await answerQuestion(
    Number(req.params.sessionId),
    req.user!.userId,
    Number(optionIndex),
    Number(answerTimeMs) || 0
  );
  res.json({ code: 0, message: "ok", data });
}

export async function listHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const quota = await planService.getQuota(userId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const where: Record<string, unknown> = { userId, finishedAt: { not: null } };
  if (type) where.type = type;
  if (!quota.historyEnabled) {
    // FREE/SINGLE 只返回最近一次完成测试
    const latest = await prisma.testSession.findFirst({
      where,
      orderBy: { finishedAt: "desc" }
    });
    return res.json({
      code: 0,
      message: "ok",
      data: { list: latest ? [latest] : [], total: latest ? 1 : 0, page, pageSize }
    });
  }
  const [total, list] = await Promise.all([
    prisma.testSession.count({ where }),
    prisma.testSession.findMany({
      where,
      orderBy: { finishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  res.json({ code: 0, message: "ok", data: { list, total, page, pageSize } });
}

export async function detailHandler(req: AuthRequest, res: Response) {
  const sessionId = Number(req.params.sessionId);
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      items: { include: { word: true }, orderBy: { seq: "asc" } },
      user: { select: { id: true, username: true } }
    }
  });
  if (!session || (session.userId !== req.user!.userId && req.user!.role !== "ADMIN")) {
    throw new ApiError(40401, "测试不存在");
  }
  res.json({ code: 0, message: "ok", data: session });
}

export async function abandonHandler(req: AuthRequest, res: Response) {
  const sessionId = Number(req.params.sessionId);
  const session = await prisma.testSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== req.user!.userId) {
    throw new ApiError(40401, "测试不存在");
  }
  if (session.finishedAt) throw new ApiError(40901, "测试已完成，无法放弃");
  await planService.refundSingleTest(req.user!.userId);
  res.json({ code: 0, message: "ok", data: null });
}

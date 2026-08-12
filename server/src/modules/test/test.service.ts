import type { Level } from "../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { getOrCreateQuestion, toClientQuestion } from "../question/question.service.js";
import { applyLevelRules, computeStreaks } from "./adaptive.engine.js";
import { estimateVocabulary } from "../report/report.service.js";
import { recordWrongWords } from "../wrong-word/wrong-word.service.js";

export type SessionType = "ADAPTIVE" | "VERIFICATION" | "WRONG_WORD";

export async function createSession(userId: number, type: SessionType, targetLevel?: Level, totalQuestions = 30) {
  return prisma.testSession.create({
    data: {
      userId,
      type,
      targetLevel,
      totalQuestions,
      correctCount: 0,
      wrongCount: 0
    }
  });
}

export async function issueQuestion(sessionId: number, seq: number, level: Level) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidates = await prisma.word.findMany({
      where: { level, status: "ENABLED" },
      select: { id: true },
      take: 500
    });
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (!pick) throw new ApiError(50001, "该等级暂无可用单词");
    try {
      const question = await getOrCreateQuestion(pick.id, level);
      const item = await prisma.testSessionItem.create({
        data: {
          sessionId,
          seq,
          wordId: pick.id,
          testedLevel: level,
          optionsSnapshot: JSON.stringify(question.options.map((o) => o.text)),
          correctOptionIndex: question.options.findIndex((o) => o.isCorrect),
          isCorrect: false
        }
      });
      return { item, question };
    } catch {
      // 该单词无释义无法出题，换一个候选词重试
    }
  }
  throw new ApiError(50001, "该等级暂无可出题单词");
}

export async function answerQuestion(
  sessionId: number,
  userId: number,
  optionIndex: number,
  answerTimeMs: number
) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  if (!session || session.userId !== userId) {
    throw new ApiError(40401, "测试不存在");
  }
  if (session.finishedAt) throw new ApiError(40901, "测试已完成");

  const item = session.items.find((it) => it.userOptionIndex === null);
  if (!item) throw new ApiError(40901, "没有待作答的题目");

  const isCorrect = optionIndex === item.correctOptionIndex;
  await prisma.testSessionItem.update({
    where: { id: item.id },
    data: { userOptionIndex: optionIndex, isCorrect, answerTimeMs }
  });

  const answered = session.items.filter((it) => it.userOptionIndex !== null).length + 1;
  const correctCount = session.correctCount + (isCorrect ? 1 : 0);
  const wrongCount = answered - correctCount;

  if (answered >= session.totalQuestions) {
    return finishSession(session.id, correctCount, wrongCount);
  }

  const allItems = session.items.map((it) =>
    it.id === item.id ? { isCorrect } : { isCorrect: it.isCorrect }
  );
  const streaks = computeStreaks(allItems);
  const nextLevel =
    session.type === "ADAPTIVE"
      ? applyLevelRules(item.testedLevel, streaks.streakCorrect, streaks.streakWrong)
      : session.type === "VERIFICATION"
        ? session.targetLevel!
        : item.testedLevel;

  await prisma.testSession.update({
    where: { id: session.id },
    data: { correctCount, wrongCount }
  });

  const next = await issueQuestion(session.id, answered + 1, nextLevel);
  const word = await prisma.word.findUniqueOrThrow({ where: { id: next.item.wordId } });
  return {
    isCorrect,
    correctIndex: item.correctOptionIndex,
    currentLevel: nextLevel,
    finished: false,
    nextQuestion: toClientQuestion({ ...next.question, word }, answered + 1, nextLevel)
  };
}

async function finishSession(sessionId: number, correctCount: number, wrongCount: number) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  const accuracy = correctCount / session.totalQuestions;
  const finalLevel =
    session.type === "VERIFICATION" ? session.targetLevel! : session.items[session.items.length - 1].testedLevel;
  const estimatedVocabulary = estimateVocabulary(finalLevel, session.items);
  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      correctCount,
      wrongCount,
      finalLevel,
      estimatedVocabulary,
      accuracy,
      finishedAt: new Date()
    }
  });
  await recordWrongWords(sessionId);
  const last = session.items[session.items.length - 1];
  return {
    isCorrect: last.isCorrect,
    correctIndex: last.correctOptionIndex,
    currentLevel: finalLevel,
    finished: true,
    reportId: sessionId
  };
}

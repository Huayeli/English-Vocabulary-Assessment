import type { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { getOrCreateQuestion, toClientQuestion } from "../question/question.service.js";
import { applyLevelRules, computeStreaks } from "./adaptive.engine.js";
import { estimateVocabulary } from "../report/report.service.js";
import { addWrongWord, subtractWrongWord } from "../wrong-word/wrong-word.service.js";

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
  const used = await prisma.testSessionItem.findMany({ where: { sessionId }, select: { wordId: true } });
  const usedIds = used.map((u) => u.wordId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidates = await prisma.word.findMany({
      where: { level, status: "ENABLED", id: { notIn: usedIds } },
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

type ItemLike = {
  id: number;
  seq: number;
  wordId: number;
  testedLevel: Level;
  correctOptionIndex: number;
  userOptionIndex: number | null;
  isCorrect: boolean;
  optionsSnapshot: string;
};

async function replayAdaptiveLevels(session: {
  type: string;
  items: ItemLike[];
}): Promise<Level> {
  const answered = session.items.filter((it) => it.userOptionIndex !== null);
  if (answered.length === 0) return "K3";
  let level: Level = "K3";
  for (let i = 0; i < answered.length; i++) {
    const it = answered[i];
    if (it.testedLevel !== level) {
      await prisma.testSessionItem.update({ where: { id: it.id }, data: { testedLevel: level } });
      it.testedLevel = level;
    }
    if (i < answered.length - 1) {
      const streaks = computeStreaks(answered.slice(0, i + 1).map((x) => ({ isCorrect: x.isCorrect })));
      level = applyLevelRules(level, streaks.streakCorrect, streaks.streakWrong);
    }
  }
  return answered[answered.length - 1].testedLevel;
}

export async function answerQuestion(
  sessionId: number,
  userId: number,
  optionIndex: number,
  answerTimeMs: number,
  seq?: number
) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  if (!session || session.userId !== userId) {
    throw new ApiError(40401, "测试不存在");
  }
  if (session.finishedAt) throw new ApiError(40901, "测试已完成");

  let item = session.items.find((it) => it.userOptionIndex === null);
  if (seq != null) {
    item = session.items.find((it) => it.seq === seq) ?? null;
    if (!item) throw new ApiError(40401, "题目不存在");
  }
  if (!item) throw new ApiError(40901, "没有待作答的题目");

  const wasAnswered = item.userOptionIndex !== null;
  const wasCorrect = item.isCorrect;
  const newCorrect = optionIndex === item.correctOptionIndex;

  await prisma.testSessionItem.update({
    where: { id: item.id },
    data: { userOptionIndex: optionIndex, isCorrect: newCorrect, answerTimeMs }
  });
  item.userOptionIndex = optionIndex;
  item.isCorrect = newCorrect;

  // 错词同步：改答导致对错变化时调整错词本
  if (wasAnswered && wasCorrect !== newCorrect) {
    const snapshot: string[] = JSON.parse(item.optionsSnapshot);
    const correctText = snapshot[item.correctOptionIndex];
    if (newCorrect) {
      await subtractWrongWord(session.userId, item.wordId);
    } else {
      await addWrongWord(session.userId, item.wordId, correctText);
    }
  } else if (!wasAnswered && !newCorrect) {
    const snapshot: string[] = JSON.parse(item.optionsSnapshot);
    await addWrongWord(session.userId, item.wordId, snapshot[item.correctOptionIndex]);
  }

  const answeredItems = session.items.filter((it) => it.userOptionIndex !== null);
  const correctCount = answeredItems.filter((it) => it.isCorrect).length;
  const wrongCount = answeredItems.length - correctCount;

  if (answeredItems.length >= session.totalQuestions) {
    return finishSession(session.id, correctCount, wrongCount);
  }

  let nextLevel: Level;
  if (session.type === "ADAPTIVE") {
    const finalLevel = await replayAdaptiveLevels({ type: session.type, items: session.items });
    const streaks = computeStreaks(answeredItems.map((x) => ({ isCorrect: x.isCorrect })));
    nextLevel = applyLevelRules(finalLevel, streaks.streakCorrect, streaks.streakWrong);
  } else if (session.type === "VERIFICATION") {
    nextLevel = session.targetLevel!;
  } else {
    nextLevel = answeredItems[answeredItems.length - 1].testedLevel;
  }

  await prisma.testSession.update({
    where: { id: session.id },
    data: { correctCount, wrongCount }
  });

  const nextSeq = answeredItems.length + 1;
  const alreadyIssued = session.items.some((it) => it.seq === nextSeq);
  let nextQuestion: ReturnType<typeof toClientQuestion> | undefined;
  if (!alreadyIssued) {
    const next = await issueQuestion(session.id, nextSeq, nextLevel);
    const word = await prisma.word.findUniqueOrThrow({ where: { id: next.item.wordId } });
    nextQuestion = toClientQuestion({ ...next.question, word }, nextSeq, nextLevel);
  }

  return {
    isCorrect: newCorrect,
    correctIndex: item.correctOptionIndex,
    currentLevel: nextLevel,
    finished: false,
    nextQuestion
  };
}

export async function finishEarly(sessionId: number, userId: number) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  if (!session || session.userId !== userId) throw new ApiError(40401, "测试不存在");
  if (session.finishedAt) throw new ApiError(40901, "测试已完成");
  if (session.type !== "WRONG_WORD") {
    throw new ApiError(40001, "当前测试类型不支持提前查看结果");
  }
  const answered = session.items.filter((it) => it.userOptionIndex !== null);
  if (answered.length === 0) throw new ApiError(40901, "请至少作答一题后再查看结果");
  const correctCount = answered.filter((it) => it.isCorrect).length;
  return finishSession(session.id, correctCount, answered.length - correctCount, answered.length);
}

async function finishSession(
  sessionId: number,
  correctCount: number,
  wrongCount: number,
  answeredTotal?: number
) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  const answeredItems = session.items.filter((it) => it.userOptionIndex !== null);
  const total = answeredTotal ?? session.totalQuestions;
  const accuracy = total > 0 ? correctCount / total : 0;
  let finalLevel: Level;
  if (session.type === "VERIFICATION") {
    finalLevel = session.targetLevel!;
  } else if (session.type === "ADAPTIVE") {
    finalLevel = await replayAdaptiveLevels({ type: session.type, items: session.items });
  } else {
    finalLevel =
      answeredItems.length > 0
        ? answeredItems[answeredItems.length - 1].testedLevel
        : session.items[session.items.length - 1].testedLevel;
  }
  const estimatedVocabulary = estimateVocabulary(finalLevel, answeredItems.length > 0 ? answeredItems : session.items);
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
  const last = answeredItems.length > 0 ? answeredItems[answeredItems.length - 1] : session.items[session.items.length - 1];
  return {
    isCorrect: last.isCorrect,
    correctIndex: last.correctOptionIndex,
    currentLevel: finalLevel,
    finished: true,
    reportId: sessionId
  };
}

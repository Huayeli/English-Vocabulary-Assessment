import type { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { LEVEL_RANK } from "../../utils/level.js";

const CEFR: Record<Level, string> = {
  K1: "A1",
  K2: "A2",
  K3: "B1",
  K5: "B2",
  K10: "C1",
  K10P: "C2"
};

export function estimateVocabulary(finalLevel: Level, items: { testedLevel: Level; isCorrect: boolean }[]): number {
  if (finalLevel !== "K10P") {
    return LEVEL_RANK[finalLevel] * 1000;
  }
  const k10pItems = items.filter((it) => it.testedLevel === "K10P");
  if (k10pItems.length === 0) return 10000;
  const rate = k10pItems.filter((it) => it.isCorrect).length / k10pItems.length;
  return 10000 + Math.round(rate * 15000);
}

export function cefrOf(level: Level): string {
  return CEFR[level];
}

export async function buildReport(sessionId: number, codeId: number, isAdmin: boolean) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      items: { include: { word: true }, orderBy: { seq: "asc" } },
      code: true
    }
  });
  if (!session || (session.activationCodeId !== codeId && !isAdmin)) {
    throw new ApiError(40401, "报告不存在");
  }

  const byLevel = new Map<Level, { answered: number; correct: number }>();
  for (const item of session.items) {
    const entry = byLevel.get(item.testedLevel) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (item.isCorrect) entry.correct += 1;
    byLevel.set(item.testedLevel, entry);
  }
  const levelMastery = [...byLevel.entries()].map(([level, v]) => ({
    level,
    answered: v.answered,
    correct: v.correct,
    rate: Number((v.correct / v.answered).toFixed(2))
  }));

  const wrongItems = session.items.filter((it) => !it.isCorrect);
  const wrongWordIds = [...new Set(wrongItems.map((it) => it.wordId))];
  const meanings = wrongWordIds.length
    ? await prisma.wordMeaning.findMany({
        where: { wordId: { in: wrongWordIds } },
        orderBy: { sortOrder: "asc" }
      })
    : [];
  const meaningsMap = new Map<number, string>();
  for (const m of meanings) {
    const prev = meaningsMap.get(m.wordId) ?? "";
    meaningsMap.set(m.wordId, prev ? `${prev}；${m.meaning}` : m.meaning);
  }
  const wrongWords = wrongItems.map((it) => {
    const snapshot: string[] = JSON.parse(it.optionsSnapshot);
    return {
      wordId: it.word.id,
      headword: it.word.headword,
      level: it.testedLevel,
      userAnswer: snapshot[it.userOptionIndex ?? 0] ?? "-",
      correctAnswer: snapshot[it.correctOptionIndex] ?? "-",
      explanation: meaningsMap.get(it.word.id) ?? snapshot[it.correctOptionIndex] ?? "-"
    };
  });

  return {
    sessionId: session.id,
    accessCode: session.code.code,
    testTime: session.startedAt,
    finishedTime: session.finishedAt,
    type: session.type,
    totalQuestions: session.totalQuestions,
    correctCount: session.correctCount,
    accuracy: session.accuracy,
    finalLevel: session.finalLevel,
    estimatedVocabulary: session.estimatedVocabulary,
    cefr: session.finalLevel ? cefrOf(session.finalLevel) : null,
    passed: session.type === "VERIFICATION" ? (session.accuracy ?? 0) >= 0.8 : null,
    levelMastery,
    wrongWords
  };
}

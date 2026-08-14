import type { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

const CEFR: Record<Level, string> = {
  K1: "A1",
  K2: "A2",
  K3: "B1",
  K4: "B1",
  K5: "B2",
  K6: "B2",
  K7: "B2",
  K8: "C1",
  K9: "C1",
  K10: "C1",
  K10P: "C2"
};

const LEVEL_FLOOR: Record<Level, number> = {
  K1: 0,
  K2: 1000,
  K3: 2000,
  K4: 3000,
  K5: 4000,
  K6: 5000,
  K7: 6000,
  K8: 7000,
  K9: 8000,
  K10: 9000,
  K10P: 10000
};

const LEVEL_BAND: Record<Level, number> = {
  K1: 1000,
  K2: 1000,
  K3: 1000,
  K4: 1000,
  K5: 1000,
  K6: 1000,
  K7: 1000,
  K8: 1000,
  K9: 1000,
  K10: 1000,
  K10P: 15000
};

export function estimateVocabulary(finalLevel: Level, items: { testedLevel: Level; isCorrect: boolean }[]): number {
  const atLevel = items.filter((it) => it.testedLevel === finalLevel);
  let mastery: number;
  if (atLevel.length > 0) {
    mastery = atLevel.filter((it) => it.isCorrect).length / atLevel.length;
  } else if (items.length > 0) {
    mastery = items.filter((it) => it.isCorrect).length / items.length;
  } else {
    mastery = 0.5;
  }
  return Math.round(LEVEL_FLOOR[finalLevel] + LEVEL_BAND[finalLevel] * mastery);
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
    reliability: session.reliability,
    suspicious: session.suspicious,
    invalid: session.invalid,
    flags: session.flags,
    finalLevel: session.finalLevel,
    estimatedVocabulary: session.estimatedVocabulary,
    cefr: session.finalLevel ? cefrOf(session.finalLevel) : null,
    passed: session.type === "VERIFICATION" ? (session.accuracy ?? 0) >= 0.8 : null,
    levelMastery,
    wrongWords
  };
}

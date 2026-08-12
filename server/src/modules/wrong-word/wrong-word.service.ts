import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { getOrCreateQuestion } from "../question/question.service.js";
import { createSession } from "../test/test.service.js";

export async function recordWrongWords(sessionId: number) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  for (const item of session.items) {
    if (item.isCorrect) continue;
    const snapshot: string[] = JSON.parse(item.optionsSnapshot);
    const correctText = snapshot[item.correctOptionIndex];
    await addWrongWord(session.userId, item.wordId, correctText);
  }
}

export async function addWrongWord(userId: number, wordId: number, correctMeaningText: string) {
  const existing = await prisma.wrongWord.findUnique({
    where: { userId_wordId: { userId, wordId } }
  });
  if (existing) {
    await prisma.wrongWord.update({
      where: { id: existing.id },
      data: { errorCount: { increment: 1 }, lastErrorAt: new Date(), correctMeaningText }
    });
  } else {
    await prisma.wrongWord.create({
      data: { userId, wordId, correctMeaningText }
    });
  }
}

export async function subtractWrongWord(userId: number, wordId: number) {
  const existing = await prisma.wrongWord.findUnique({
    where: { userId_wordId: { userId, wordId } }
  });
  if (!existing) return;
  if (existing.errorCount <= 1) {
    await prisma.wrongWord.delete({ where: { id: existing.id } });
  } else {
    await prisma.wrongWord.update({ where: { id: existing.id }, data: { errorCount: { decrement: 1 } } });
  }
}

export async function listWrongWords(userId: number, page: number, pageSize: number) {
  const where = { userId };
  const [total, list] = await Promise.all([
    prisma.wrongWord.count({ where }),
    prisma.wrongWord.findMany({
      where,
      include: { word: true },
      orderBy: [{ errorCount: "desc" }, { lastErrorAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  return {
    list: list.map((w) => ({
      id: w.id,
      headword: w.word.headword,
      level: w.word.level,
      correctMeaning: w.correctMeaningText,
      errorCount: w.errorCount,
      lastErrorTime: w.lastErrorAt
    })),
    total,
    page,
    pageSize
  };
}

export async function removeWrongWord(userId: number, id: number) {
  const result = await prisma.wrongWord.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new ApiError(40401, "错词不存在");
}

export async function reviewWrongWord(userId: number, id: number) {
  await removeWrongWord(userId, id); // 复习确认掌握后移除
}

export async function createWrongWordSession(userId: number) {
  const wrongs = await prisma.wrongWord.findMany({
    where: { userId },
    include: { word: true },
    orderBy: [{ errorCount: "desc" }],
    take: 10
  });
  if (wrongs.length === 0) throw new ApiError(40401, "错词本为空");
  const session = await createSession(userId, "WRONG_WORD", undefined, wrongs.length);
  for (let i = 0; i < wrongs.length; i++) {
    const question = await getOrCreateQuestion(wrongs[i].wordId, wrongs[i].word.level);
    await prisma.testSessionItem.create({
      data: {
        sessionId: session.id,
        seq: i + 1,
        wordId: wrongs[i].wordId,
        testedLevel: wrongs[i].word.level,
        optionsSnapshot: JSON.stringify(question.options.map((o) => o.text)),
        correctOptionIndex: question.options.findIndex((o) => o.isCorrect),
        isCorrect: false
      }
    });
  }
  return session;
}

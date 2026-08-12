import type { Level } from "../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickDistractors(
  wordId: number,
  level: Level,
  correctMeaning: string,
  count = 4
): Promise<string[]> {
  const sameLevel = await prisma.wordMeaning.findMany({
    where: { wordId: { not: wordId }, word: { level } },
    select: { meaning: true },
    take: 200
  });
  const fallback =
    sameLevel.length < count
      ? await prisma.wordMeaning.findMany({
          where: { wordId: { not: wordId }, meaning: { not: correctMeaning } },
          select: { meaning: true },
          take: 200
        })
      : [];
  const pool = [...sameLevel, ...fallback].map((m) => m.meaning).filter((t) => t !== correctMeaning);
  const unique = [...new Set(pool)];
  if (unique.length < count) {
    throw new ApiError(50001, "干扰项不足，无法生成题目");
  }
  return shuffle(unique).slice(0, count);
}

export async function getOrCreateQuestion(wordId: number, level: Level) {
  const cached = await prisma.question.findFirst({
    where: { wordId, disabled: false },
    include: { options: true }
  });
  if (cached) return cached;

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { meanings: { orderBy: { sortOrder: "asc" }, take: 10 } }
  });
  if (!word || word.meanings.length === 0) {
    throw new ApiError(40401, "该单词暂无释义，无法出题");
  }
  const correct = word.meanings[0];
  const distractors = await pickDistractors(wordId, level, correct.meaning);
  const options = shuffle([correct.meaning, ...distractors]);

  return prisma.question.create({
    data: {
      wordId,
      correctMeaningId: correct.id,
      level,
      options: {
        create: options.map((text, i) => ({
          text,
          meaningId: text === correct.meaning ? correct.id : null,
          isCorrect: text === correct.meaning,
          sortOrder: i
        }))
      }
    },
    include: { options: true }
  });
}

export function toClientQuestion(
  question: {
    options: { text: string; isCorrect: boolean; sortOrder: number }[];
    word?: { headword: string };
  },
  seq: number,
  testedLevel: Level
) {
  const options = [...question.options].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => o.text);
  const headword = question.word?.headword ?? "";
  return {
    seq,
    word: headword,
    question: `${headword}是什么意思？`,
    options,
    testedLevel
  };
}

import type { Level } from "../../generated/prisma/enums.js";
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
  count = 3
): Promise<string[]> {
  // 优先取与正确答案"相关"的干扰项：共享中文关键词（如都含"弃"、"放"）
  const chars = [...new Set(correctMeaning.match(/[\u4e00-\u9fa5]/g) ?? [])].filter(
    (c) => !"的了与和及或而".includes(c)
  );
  const related =
    chars.length > 0
      ? await prisma.wordMeaning.findMany({
          where: {
            wordId: { not: wordId },
            word: { level },
            meaning: { not: correctMeaning },
            OR: chars.slice(0, 3).map((c) => ({ meaning: { contains: c } }))
          },
          select: { meaning: true },
          take: 100
        })
      : [];
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
  const pool = [...related, ...sameLevel, ...fallback].map((m) => m.meaning).filter((t) => t !== correctMeaning);
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
  if (cached) {
    // 历史缓存可能还是 5 选项版本，统一作废重建为 4 选项
    if (cached.options.length !== 4) {
      await prisma.question.delete({ where: { id: cached.id } });
    } else {
      return cached;
    }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { meanings: { orderBy: { sortOrder: "asc" }, take: 10 } }
  });
  if (!word || word.meanings.length === 0) {
    throw new ApiError(40401, "该单词暂无释义，无法出题");
  }
  const correct = word.meanings[0];
  const distractors = await pickDistractors(wordId, level, correct.meaning);
  const options = shuffle([correct.meaning, ...distractors]); // 1 正确 + 3 干扰 = 4 选项

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
    question: "请选择该单词的正确释义",
    options,
    testedLevel
  };
}

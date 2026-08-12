import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { prisma } from "../src/utils/prisma.js";
import { getOrCreateQuestion, toClientQuestion } from "../src/modules/question/question.service.js";
import { Level } from "../src/generated/prisma/enums.js";

let abandonWordId = 0;
let createdQuestionId: number | null = null;

beforeAll(async () => {
  const word = await prisma.word.findUnique({ where: { headword: "abandon" } });
  if (!word) throw new Error("abandon not seeded");
  abandonWordId = word.id;
});

afterAll(async () => {
  if (createdQuestionId) {
    await prisma.question.delete({ where: { id: createdQuestionId } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

describe("question engine", () => {
  it("generates a five-choice question with valid options", async () => {
    const word = await prisma.word.findUnique({
      where: { id: abandonWordId },
      include: { meanings: true }
    });
    const q = await getOrCreateQuestion(abandonWordId, Level.K3);
    createdQuestionId = q.id;

    const options = q.options;
    expect(options).toHaveLength(5);
    const texts = options.map((o) => o.text);
    expect(new Set(texts).size).toBe(5); // 无重复文本
    expect(texts).toContain(word!.meanings[0].meaning); // 包含正确答案
    expect(options.filter((o) => o.isCorrect)).toHaveLength(1);

    const otherMeanings = new Set(word!.meanings.slice(1).map((m) => m.meaning));
    const distractors = options.filter((o) => !o.isCorrect).map((o) => o.text);
    for (const d of distractors) {
      expect(otherMeanings.has(d)).toBe(false); // 不使用目标单词其他释义
    }
  });

  it("reuses cached question", async () => {
    const q1 = await getOrCreateQuestion(abandonWordId, Level.K3);
    const q2 = await getOrCreateQuestion(abandonWordId, Level.K3);
    expect(q2.id).toBe(q1.id);
  });

  it("serializes question without correct index", async () => {
    const q = await getOrCreateQuestion(abandonWordId, Level.K3);
    const client = toClientQuestion({ ...q, word: { headword: "abandon" } }, 1, Level.K3);
    expect(client.word).toBe("abandon");
    expect(client.question).toBe("请选择该单词的正确释义");
    expect(client.options).toHaveLength(5);
    expect(client.testedLevel).toBe(Level.K3);
  });

  it("throws for word without meanings", async () => {
    const word = await prisma.word.findFirst({ where: { meanings: { none: {} } } });
    if (!word) throw new Error("no meaning-less word found");
    await expect(getOrCreateQuestion(word.id, word.level)).rejects.toMatchObject({ code: 40401 });
  });
});

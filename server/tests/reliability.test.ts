import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { prisma } from "../src/utils/prisma.js";
import { assessSession } from "../src/modules/test/reliability.service.js";
import { Level } from "../src/generated/prisma/enums.js";

let codeId = 0;
let wordId = 0;

async function makeSession(
  type: string,
  items: { correctIndex: number; optionIndex: number; ms: number; level: Level }[]
) {
  return prisma.testSession.create({
    data: {
      activationCodeId: codeId,
      type,
      totalQuestions: items.length,
      correctCount: items.filter((i) => i.optionIndex === i.correctIndex).length,
      wrongCount: items.length - items.filter((i) => i.optionIndex === i.correctIndex).length,
      accuracy: items.filter((i) => i.optionIndex === i.correctIndex).length / items.length,
      startedAt: new Date(Date.now() - 60_000),
      finishedAt: new Date(),
      items: {
        create: items.map((it, i) => ({
          seq: i + 1,
          wordId,
          testedLevel: it.level,
          optionsSnapshot: JSON.stringify(["A", "B", "C", "D"]),
          correctOptionIndex: it.correctIndex,
          userOptionIndex: it.optionIndex,
          isCorrect: it.optionIndex === it.correctIndex,
          answerTimeMs: it.ms
        }))
      }
    }
  });
}

beforeAll(async () => {
  const batch = await prisma.batch.create({ data: { name: "reliability-test-batch" } });
  const rec = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `Q${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests: null }
  });
  codeId = rec.id;
  wordId = (await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } })).id;
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { activationCodeId: codeId } });
  await prisma.activationCode.delete({ where: { id: codeId } });
  await prisma.batch.deleteMany({ where: { name: "reliability-test-batch" } });
  await prisma.$disconnect();
});

describe("reliability assessment", () => {
  it("flags random fast answering as 疑似乱答", async () => {
    // 正确率 30%，平均用时 300ms，答案位置分散
    const items = Array.from({ length: 10 }, (_, i) => ({
      correctIndex: i % 4,
      optionIndex: i < 3 ? i % 4 : (i % 4 + 1) % 4,
      ms: 300,
      level: Level.K3
    }));
    const s = await makeSession("ADAPTIVE", items);
    await assessSession(s.id);
    const after = await prisma.testSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.flags).toContain("疑似乱答");
    expect(after.reliability).toBe(60);
    expect(after.suspicious).toBe(true);
    await prisma.testSession.delete({ where: { id: s.id } });
  });

  it("flags fast all-correct answering as 答题过快", async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      correctIndex: i % 4,
      optionIndex: i % 4,
      ms: 1000,
      level: Level.K3
    }));
    const s = await makeSession("VERIFICATION", items);
    await assessSession(s.id);
    const after = await prisma.testSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.flags).toContain("答题过快");
    expect(after.reliability).toBe(70);
    await prisma.testSession.delete({ where: { id: s.id } });
  });

  it("flags concentrated option selection", async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      correctIndex: i % 4,
      optionIndex: 1,
      ms: 4000,
      level: Level.K3
    }));
    const s = await makeSession("ADAPTIVE", items);
    await assessSession(s.id);
    const after = await prisma.testSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.flags).toContain("选项集中");
    await prisma.testSession.delete({ where: { id: s.id } });
  });

  it("flags volatile adaptive level path", async () => {
    const levels = [Level.K1, Level.K5, Level.K1, Level.K5, Level.K1, Level.K5, Level.K1, Level.K5];
    const items = levels.map((level, i) => ({
      correctIndex: i % 4,
      optionIndex: i % 4,
      ms: 4000,
      level
    }));
    const s = await makeSession("ADAPTIVE", items);
    await assessSession(s.id);
    const after = await prisma.testSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.flags).toContain("等级波动异常");
    await prisma.testSession.delete({ where: { id: s.id } });
  });
});

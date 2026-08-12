import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import { Level } from "../src/generated/prisma/enums.js";
import { buildReport, estimateVocabulary } from "../src/modules/report/report.service.js";

let userId = 0;
let userToken = "";
let sessionId = 0;

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const user = await prisma.user.create({
    data: { username: "reportuser", passwordHash: "unused", packageId: free.id }
  });
  userId = user.id;
  userToken = signToken({ userId: user.id, role: "USER" });

  const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
  const session = await prisma.testSession.create({
    data: {
      userId,
      type: "ADAPTIVE",
      totalQuestions: 3,
      correctCount: 2,
      wrongCount: 1,
      accuracy: 2 / 3,
      finalLevel: Level.K3,
      estimatedVocabulary: 3000,
      finishedAt: new Date(),
      items: {
        create: [
          {
            seq: 1,
            wordId: word.id,
            testedLevel: Level.K1,
            optionsSnapshot: JSON.stringify(["正确一", "错误一"]),
            correctOptionIndex: 0,
            userOptionIndex: 0,
            isCorrect: true,
            answerTimeMs: 1000
          },
          {
            seq: 2,
            wordId: word.id,
            testedLevel: Level.K1,
            optionsSnapshot: JSON.stringify(["正确二", "错误二"]),
            correctOptionIndex: 0,
            userOptionIndex: 0,
            isCorrect: true,
            answerTimeMs: 1000
          },
          {
            seq: 3,
            wordId: word.id,
            testedLevel: Level.K3,
            optionsSnapshot: JSON.stringify(["正确三", "错误三"]),
            correctOptionIndex: 0,
            userOptionIndex: 1,
            isCorrect: false,
            answerTimeMs: 1000
          }
        ]
      }
    }
  });
  sessionId = session.id;
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("report", () => {
  it("builds mastery per level", async () => {
    const report = await buildReport(sessionId, userId, "USER");
    expect(report.levelMastery).toEqual([
      { level: Level.K1, answered: 2, correct: 2, rate: 1 },
      { level: Level.K3, answered: 1, correct: 0, rate: 0 }
    ]);
    expect(report.finalLevel).toBe(Level.K3);
    expect(report.estimatedVocabulary).toBe(3000);
    expect(report.cefr).toBe("B1");
    expect(report.wrongWords).toHaveLength(1);
    expect(report.wrongWords[0].headword).toBe("abandon");
  });

  it("estimates vocabulary for fixed levels", () => {
    expect(estimateVocabulary(Level.K5, [])).toBe(5000);
    expect(
      estimateVocabulary(Level.K10P, [
        { testedLevel: Level.K10P, isCorrect: true },
        { testedLevel: Level.K10P, isCorrect: false }
      ])
    ).toBe(17500);
  });

  it("hides report from other users", async () => {
    const other = await prisma.user.create({
      data: { username: "reportother", passwordHash: "unused", packageId: (await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } })).id }
    });
    const otherToken = signToken({ userId: other.id, role: "USER" });
    const res = await request(createApp())
      .get(`/api/reports/${sessionId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.body.code).toBe(40401);
    await prisma.user.deleteMany({ where: { id: other.id } });
  });
});

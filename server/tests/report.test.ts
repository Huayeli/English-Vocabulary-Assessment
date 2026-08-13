import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { Level } from "../src/generated/prisma/enums.js";
import { buildReport, estimateVocabulary } from "../src/modules/report/report.service.js";

let codeId = 0;
let code = "";
let otherCodeId = 0;
let otherCode = "";
let sessionId = 0;

beforeAll(async () => {
  const batch = await prisma.batch.create({ data: { name: "report-test-batch" } });
  const a = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `R${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests: null }
  });
  const b = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `S${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests: null }
  });
  codeId = a.id;
  code = a.code;
  otherCodeId = b.id;
  otherCode = b.code;

  const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
  const session = await prisma.testSession.create({
    data: {
      activationCodeId: codeId,
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
  await prisma.testSession.deleteMany({ where: { activationCodeId: { in: [codeId, otherCodeId] } } });
  await prisma.activationCode.deleteMany({ where: { id: { in: [codeId, otherCodeId] } } });
  await prisma.batch.deleteMany({ where: { name: "report-test-batch" } });
  await prisma.$disconnect();
});

describe("report", () => {
  it("builds mastery per level", async () => {
    const report = await buildReport(sessionId, codeId, false);
    expect(report.levelMastery).toEqual([
      { level: Level.K1, answered: 2, correct: 2, rate: 1 },
      { level: Level.K3, answered: 1, correct: 0, rate: 0 }
    ]);
    expect(report.finalLevel).toBe(Level.K3);
    expect(report.estimatedVocabulary).toBe(3000);
    expect(report.cefr).toBe("B1");
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

  it("hides report from other codes", async () => {
    const res = await request(createApp()).get(`/api/reports/${sessionId}`).set("x-access-code", otherCode);
    expect(res.body.code).toBe(40401);
  });

  it("exposes report to owner via api", async () => {
    const res = await request(createApp()).get(`/api/reports/${sessionId}`).set("x-access-code", code);
    expect(res.body.code).toBe(0);
    expect(res.body.data.finishedTime).not.toBeNull();
  });
});

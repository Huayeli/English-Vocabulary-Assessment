import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { Level } from "../src/generated/prisma/enums.js";
import {
  recordWrongWords,
  listWrongWords,
  reviewWrongWord,
  createWrongWordSession
} from "../src/modules/wrong-word/wrong-word.service.js";

let code = "";
let codeId = 0;
let wordId = 0;

beforeAll(async () => {
  const batch = await prisma.batch.create({ data: { name: "wrong-test-batch" } });
  const rec = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `W${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests: null }
  });
  code = rec.code;
  codeId = rec.id;
  const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
  wordId = word.id;
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { activationCodeId: codeId } });
  await prisma.wrongWord.deleteMany({ where: { activationCodeId: codeId } });
  await prisma.activationCode.delete({ where: { id: codeId } });
  await prisma.batch.deleteMany({ where: { name: "wrong-test-batch" } });
  await prisma.$disconnect();
});

async function makeWrongSession() {
  const session = await prisma.testSession.create({
    data: {
      activationCodeId: codeId,
      type: "ADAPTIVE",
      totalQuestions: 1,
      finishedAt: new Date(),
      items: {
        create: [
          {
            seq: 1,
            wordId,
            testedLevel: Level.K3,
            optionsSnapshot: JSON.stringify(["抛弃、放弃", "接受", "维持", "改进"]),
            correctOptionIndex: 0,
            userOptionIndex: 1,
            isCorrect: false,
            answerTimeMs: 1000
          }
        ]
      }
    }
  });
  return session;
}

describe("wrong word book", () => {
  it("records wrong words and accumulates error count", async () => {
    const session = await makeWrongSession();
    await recordWrongWords(session.id);
    const first = await listWrongWords(codeId, 1, 20);
    expect(first.total).toBe(1);
    expect(first.list[0].headword).toBe("abandon");
    expect(first.list[0].errorCount).toBe(1);

    await recordWrongWords(session.id);
    const second = await listWrongWords(codeId, 1, 20);
    expect(second.list[0].errorCount).toBe(2);
    await prisma.testSession.delete({ where: { id: session.id } });
  });

  it("lists wrong words via api", async () => {
    const res = await request(createApp()).get("/api/wrong-words").set("x-access-code", code);
    expect(res.body.code).toBe(0);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].correctMeaning).toBe("抛弃、放弃");
  });

  it("review removes wrong word", async () => {
    const list = await listWrongWords(codeId, 1, 20);
    await reviewWrongWord(codeId, list.list[0].id);
    const after = await listWrongWords(codeId, 1, 20);
    expect(after.total).toBe(0);
  });

  it("creates wrong-word session and starts via api", async () => {
    const session = await makeWrongSession();
    await recordWrongWords(session.id);
    const created = await createWrongWordSession(codeId);
    expect(created.totalQuestions).toBe(1);
    await prisma.testSession.delete({ where: { id: created.id } });

    const start = await request(createApp()).post("/api/tests/wrong-word/start").set("x-access-code", code);
    expect(start.body.code).toBe(0);
    expect(start.body.data.totalQuestions).toBe(1);
    expect(start.body.data.question.word).toBe("abandon");
    await prisma.testSession.delete({ where: { id: start.body.data.sessionId } });
    await prisma.testSession.delete({ where: { id: session.id } });
  });

  it("finishes wrong-word test early and shows result", async () => {
    const secondWord = await prisma.word.findUniqueOrThrow({ where: { headword: "accept" } });
    await prisma.wrongWord.create({
      data: { activationCodeId: codeId, wordId: secondWord.id, correctMeaningText: "接受" }
    });
    const app = createApp();
    const start = await request(app).post("/api/tests/wrong-word/start").set("x-access-code", code);
    expect(start.body.data.totalQuestions).toBe(2);
    const sessionId = start.body.data.sessionId;

    const item = await prisma.testSessionItem.findFirstOrThrow({
      where: { sessionId, userOptionIndex: null },
      orderBy: { seq: "asc" }
    });
    await request(app)
      .post(`/api/tests/${sessionId}/answer`)
      .set("x-access-code", code)
      .send({ optionIndex: item.correctOptionIndex, answerTimeMs: 1000 });

    const finish = await request(app).post(`/api/tests/${sessionId}/finish`).set("x-access-code", code);
    expect(finish.body.data.finished).toBe(true);
    const report = await request(app).get(`/api/reports/${sessionId}`).set("x-access-code", code);
    expect(report.body.data.accuracy).toBe(1);

    await prisma.testSession.delete({ where: { id: sessionId } });
    await prisma.wrongWord.deleteMany({ where: { activationCodeId: codeId, wordId: secondWord.id } });
  });
});

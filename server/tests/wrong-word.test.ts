import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import { Level } from "../src/generated/prisma/enums.js";
import { recordWrongWords, listWrongWords, reviewWrongWord, createWrongWordSession } from "../src/modules/wrong-word/wrong-word.service.js";

let userId = 0;
let monthlyToken = "";
let wordId = 0;
let sessionId = 0;

beforeAll(async () => {
  const monthly = await prisma.plan.findUniqueOrThrow({ where: { code: "MONTHLY" } });
  await prisma.user.deleteMany({ where: { username: "wronguser" } });
  const user = await prisma.user.create({
    data: {
      username: "wronguser",
      passwordHash: "unused",
      packageId: monthly.id,
      packageExpireTime: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    }
  });
  userId = user.id;
  monthlyToken = signToken({ userId: user.id, role: "USER" });
  const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
  wordId = word.id;
  await prisma.wrongWord.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { userId } }).catch(() => undefined);
  await prisma.wrongWord.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

async function makeWrongSession() {
  const session = await prisma.testSession.create({
    data: {
      userId,
      type: "ADAPTIVE",
      totalQuestions: 1,
      finishedAt: new Date(),
      items: {
        create: [
          {
            seq: 1,
            wordId,
            testedLevel: Level.K3,
            optionsSnapshot: JSON.stringify(["抛弃、放弃", "接受", "维持", "改进", "恢复"]),
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
  return session;
}

describe("wrong word book", () => {
  it("records wrong words and accumulates error count", async () => {
    await makeWrongSession();
    await recordWrongWords(sessionId);
    const first = await listWrongWords(userId, 1, 20);
    expect(first.total).toBe(1);
    expect(first.list[0].headword).toBe("abandon");
    expect(first.list[0].errorCount).toBe(1);

    await recordWrongWords(sessionId);
    const second = await listWrongWords(userId, 1, 20);
    expect(second.list[0].errorCount).toBe(2);
  });

  it("lists wrong words via api", async () => {
    const res = await request(createApp())
      .get("/api/wrong-words")
      .set("Authorization", `Bearer ${monthlyToken}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].correctMeaning).toBe("抛弃、放弃");
  });

  it("review removes wrong word", async () => {
    const list = await listWrongWords(userId, 1, 20);
    await reviewWrongWord(userId, list.list[0].id);
    const after = await listWrongWords(userId, 1, 20);
    expect(after.total).toBe(0);
  });

  it("creates wrong-word session with the wrong words", async () => {
    await makeWrongSession();
    await recordWrongWords(sessionId);
    const session = await createWrongWordSession(userId);
    expect(session.totalQuestions).toBe(1);
    const item = await prisma.testSessionItem.findFirstOrThrow({ where: { sessionId: session.id } });
    expect(item.wordId).toBe(wordId);
    await prisma.testSession.delete({ where: { id: session.id } });
  });

  it("starts wrong-word test via api", async () => {
    const res = await request(createApp())
      .post("/api/tests/wrong-word/start")
      .set("Authorization", `Bearer ${monthlyToken}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.totalQuestions).toBe(1);
    expect(res.body.data.question.word).toBe("abandon");
    await prisma.testSession.delete({ where: { id: res.body.data.sessionId } });
  });
});

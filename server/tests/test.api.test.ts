import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";

let unlimitedCode = "";
let unlimitedCodeId = 0;
let limitedCode = "";
let limitedCodeId = 0;

async function createCode(maxTests: number | null) {
  const batch = await prisma.batch.create({ data: { name: "api-test-batch" } });
  const rec = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `T${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests }
  });
  return rec;
}

beforeAll(async () => {
  const a = await createCode(null);
  unlimitedCode = a.code;
  unlimitedCodeId = a.id;
  const b = await createCode(1);
  limitedCode = b.code;
  limitedCodeId = b.id;
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { activationCodeId: { in: [unlimitedCodeId, limitedCodeId] } } });
  await prisma.activationCode.deleteMany({ where: { code: { in: [unlimitedCode, limitedCode] } } });
  await prisma.batch.deleteMany({ where: { name: "api-test-batch" } });
  await prisma.$disconnect();
});

async function currentCorrectIndex(sessionId: number) {
  const item = await prisma.testSessionItem.findFirst({
    where: { sessionId, userOptionIndex: null },
    orderBy: { seq: "asc" }
  });
  if (!item) throw new Error("no pending item");
  return item.correctOptionIndex;
}

async function answerCurrent(app: ReturnType<typeof createApp>, code: string, sessionId: number, correct: boolean) {
  const correctIndex = await currentCorrectIndex(sessionId);
  const optionIndex = correct ? correctIndex : (correctIndex + 1) % 4;
  const res = await request(app)
    .post(`/api/tests/${sessionId}/answer`)
    .set("x-access-code", code)
    .send({ optionIndex, answerTimeMs: 1000 });
  return res.body.data;
}

async function abandon(app: ReturnType<typeof createApp>, code: string, sessionId: number) {
  await request(app).post(`/api/tests/${sessionId}/abandon`).set("x-access-code", code);
}

describe("adaptive test api", () => {
  it("starts at K3 with 30 questions and 4 options", async () => {
    const app = createApp();
    const res = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    expect(res.body.code).toBe(0);
    expect(res.body.data.totalQuestions).toBe(30);
    expect(res.body.data.currentLevel).toBe("K3");
    expect(res.body.data.question.options).toHaveLength(4);
    await abandon(app, unlimitedCode, res.body.data.sessionId);
  });

  it("raises level to K5 after 4 consecutive correct answers", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    const sessionId = start.body.data.sessionId;
    let nextLevel = "";
    for (let i = 0; i < 4; i++) {
      const data = await answerCurrent(app, unlimitedCode, sessionId, true);
      if (i === 3) nextLevel = data.nextQuestion.testedLevel;
    }
    expect(nextLevel).toBe("K5");
    await abandon(app, unlimitedCode, sessionId);
  });

  it("finishes after 30 questions and increments usage", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    const sessionId = start.body.data.sessionId;
    let final: any = null;
    for (let i = 0; i < 30; i++) {
      final = await answerCurrent(app, unlimitedCode, sessionId, true);
    }
    expect(final.finished).toBe(true);
    const session = await prisma.testSession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(session.finalLevel).toBe("K10P");
    expect(session.correctCount).toBe(30);
    expect(session.reliability).not.toBeNull();
  });

  it("blocks new start while unfinished and abandons via confirm endpoint", async () => {
    const app = createApp();
    const first = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    expect(first.body.code).toBe(0);

    const active = await request(app).get("/api/tests/active").set("x-access-code", unlimitedCode);
    expect(active.body.data.hasActive).toBe(true);

    const blocked = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    expect(blocked.body.code).toBe(40302);

    const abandonRes = await request(app).post("/api/tests/abandon-active").set("x-access-code", unlimitedCode);
    expect(abandonRes.body.code).toBe(0);
    const activeAfter = await request(app).get("/api/tests/active").set("x-access-code", unlimitedCode);
    expect(activeAfter.body.data.hasActive).toBe(false);

    const second = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    expect(second.body.code).toBe(0);
    const updated = await prisma.testSession.findUniqueOrThrow({ where: { id: first.body.data.sessionId } });
    expect(updated.abandoned).toBe(true);
    await abandon(app, unlimitedCode, second.body.data.sessionId);
  });

  it("auto-abandons stale sessions on new start", async () => {
    const app = createApp();
    // 清掉可能残留的活跃会话，保证本用例独立
    await request(app).post("/api/tests/abandon-active").set("x-access-code", unlimitedCode);
    const stale = await prisma.testSession.create({
      data: {
        activationCodeId: unlimitedCodeId,
        type: "ADAPTIVE",
        totalQuestions: 30,
        startedAt: new Date(Date.now() - 40 * 60 * 1000)
      }
    });
    const res = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    expect(res.body.code).toBe(0);
    await abandon(app, unlimitedCode, res.body.data.sessionId);
    const updated = await prisma.testSession.findUniqueOrThrow({ where: { id: stale.id } });
    expect(updated.abandoned).toBe(true);
  });

  it("blocks start when code usage is exhausted", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("x-access-code", limitedCode);
    expect(start.body.code).toBe(0);
    const sessionId = start.body.data.sessionId;
    for (let i = 0; i < 30; i++) {
      await answerCurrent(app, limitedCode, sessionId, true);
    }
    const blocked = await request(app).post("/api/tests/adaptive/start").set("x-access-code", limitedCode);
    expect(blocked.body.code).toBe(40302);
  });

  it("requires a valid access code", async () => {
    const res = await request(createApp()).post("/api/tests/adaptive/start");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });

  it("re-answers a previous question and recomputes levels", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("x-access-code", unlimitedCode);
    const sessionId = start.body.data.sessionId;

    const q1Index = await currentCorrectIndex(sessionId);
    await request(app)
      .post(`/api/tests/${sessionId}/answer`)
      .set("x-access-code", unlimitedCode)
      .send({ optionIndex: q1Index, answerTimeMs: 1000 });

    const re = await request(app)
      .post(`/api/tests/${sessionId}/answer`)
      .set("x-access-code", unlimitedCode)
      .send({ optionIndex: (q1Index + 1) % 4, answerTimeMs: 1000, seq: 1 });
    expect(re.body.code).toBe(0);
    expect(re.body.data.isCorrect).toBe(false);

    const q2Index = await currentCorrectIndex(sessionId);
    const q2 = await request(app)
      .post(`/api/tests/${sessionId}/answer`)
      .set("x-access-code", unlimitedCode)
      .send({ optionIndex: (q2Index + 1) % 4, answerTimeMs: 1000, seq: 2 });
    expect(q2.body.data.nextQuestion.testedLevel).toBe("K2");

    const session = await prisma.testSession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(session.correctCount).toBe(0);
    expect(session.wrongCount).toBe(2);
    await abandon(app, unlimitedCode, sessionId);
  });
});

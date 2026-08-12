import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";

let freeToken = "";
let freeUserId = 0;

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const user = await prisma.user.create({
    data: { username: "testrunner", passwordHash: "unused", packageId: free.id }
  });
  freeUserId = user.id;
  freeToken = signToken({ userId: user.id, role: "USER" });
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { userId: freeUserId } });
  await prisma.user.deleteMany({ where: { id: freeUserId } });
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

async function answerCurrent(app: ReturnType<typeof createApp>, token: string, sessionId: number, correct: boolean) {
  const correctIndex = await currentCorrectIndex(sessionId);
  const optionIndex = correct ? correctIndex : (correctIndex + 1) % 5;
  const res = await request(app)
    .post(`/api/tests/${sessionId}/answer`)
    .set("Authorization", `Bearer ${token}`)
    .send({ optionIndex, answerTimeMs: 3000 });
  return res.body.data;
}

describe("adaptive test api", () => {
  it("starts at K3 with 30 questions", async () => {
    const res = await request(createApp())
      .post("/api/tests/adaptive/start")
      .set("Authorization", `Bearer ${freeToken}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.totalQuestions).toBe(30);
    expect(res.body.data.currentLevel).toBe("K3");
    expect(res.body.data.question.testedLevel).toBe("K3");
    expect(res.body.data.question.options).toHaveLength(5);
  });

  it("raises level to K5 after 4 consecutive correct answers", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("Authorization", `Bearer ${freeToken}`);
    const sessionId = start.body.data.sessionId;
    let nextLevel = "";
    for (let i = 0; i < 4; i++) {
      const data = await answerCurrent(app, freeToken, sessionId, true);
      if (i === 3) nextLevel = data.nextQuestion.testedLevel;
    }
    expect(nextLevel).toBe("K5");
  });

  it("finishes after 30 questions with reportId", async () => {
    const app = createApp();
    const start = await request(app).post("/api/tests/adaptive/start").set("Authorization", `Bearer ${freeToken}`);
    const sessionId = start.body.data.sessionId;
    let final: any = null;
    for (let i = 0; i < 30; i++) {
      final = await answerCurrent(app, freeToken, sessionId, true);
    }
    expect(final.finished).toBe(true);
    expect(final.reportId).toBe(sessionId);

    const session = await prisma.testSession.findUniqueOrThrow({ where: { id: sessionId } });
    expect(session.finishedAt).not.toBeNull();
    expect(session.finalLevel).toBe("K10P");
    expect(session.correctCount).toBe(30);
  });

  it("blocks free user's second test of the day", async () => {
    const res = await request(createApp())
      .post("/api/tests/adaptive/start")
      .set("Authorization", `Bearer ${freeToken}`);
    expect(res.body.code).toBe(40302);
  });

  it("requires auth", async () => {
    const res = await request(createApp()).post("/api/tests/adaptive/start");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });
});

import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import { Level } from "../src/generated/prisma/enums.js";

let monthlyToken = "";
let monthlyUserId = 0;
let freeToken = "";
let freeUserId = 0;

beforeAll(async () => {
  const monthly = await prisma.plan.findUniqueOrThrow({ where: { code: "MONTHLY" } });
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const mUser = await prisma.user.create({
    data: {
      username: "verifmonthly",
      passwordHash: "unused",
      packageId: monthly.id,
      packageExpireTime: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    }
  });
  const fUser = await prisma.user.create({
    data: { username: "veriffree", passwordHash: "unused", packageId: free.id }
  });
  monthlyUserId = mUser.id;
  freeUserId = fUser.id;
  monthlyToken = signToken({ userId: mUser.id, role: "USER" });
  freeToken = signToken({ userId: fUser.id, role: "USER" });
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { userId: { in: [monthlyUserId, freeUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [monthlyUserId, freeUserId] } } });
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

async function answer(app: ReturnType<typeof createApp>, token: string, sessionId: number, correct: boolean) {
  const correctIndex = await currentCorrectIndex(sessionId);
  const optionIndex = correct ? correctIndex : (correctIndex + 1) % 5;
  return request(app)
    .post(`/api/tests/${sessionId}/answer`)
    .set("Authorization", `Bearer ${token}`)
    .send({ optionIndex, answerTimeMs: 2000 });
}

describe("verification test", () => {
  it("passes K3 verification with 30/30 correct", async () => {
    const app = createApp();
    const start = await request(app)
      .post("/api/tests/verification/start")
      .set("Authorization", `Bearer ${monthlyToken}`)
      .send({ level: "K3" });
    expect(start.body.code).toBe(0);
    const sessionId = start.body.data.sessionId;

    let finalRes: any = null;
    for (let i = 0; i < 30; i++) {
      finalRes = await answer(app, monthlyToken, sessionId, true);
      expect(finalRes.body.code).toBe(0);
    }
    expect(finalRes.body.data.finished).toBe(true);

    const report = await request(app)
      .get(`/api/reports/${sessionId}`)
      .set("Authorization", `Bearer ${monthlyToken}`);
    expect(report.body.data.passed).toBe(true);
    expect(report.body.data.finalLevel).toBe(Level.K3);
  });

  it("fails K3 verification with 23/30 correct", async () => {
    const app = createApp();
    const start = await request(app)
      .post("/api/tests/verification/start")
      .set("Authorization", `Bearer ${monthlyToken}`)
      .send({ level: "K3" });
    const sessionId = start.body.data.sessionId;

    let finalRes: any = null;
    for (let i = 0; i < 30; i++) {
      finalRes = await answer(app, monthlyToken, sessionId, i < 23);
    }
    expect(finalRes.body.data.finished).toBe(true);

    const report = await request(app)
      .get(`/api/reports/${sessionId}`)
      .set("Authorization", `Bearer ${monthlyToken}`);
    expect(report.body.data.accuracy).toBeCloseTo(23 / 30, 2);
    expect(report.body.data.passed).toBe(false);
  });

  it("blocks free user from verification", async () => {
    const res = await request(createApp())
      .post("/api/tests/verification/start")
      .set("Authorization", `Bearer ${freeToken}`)
      .send({ level: "K3" });
    expect(res.body.code).toBe(40302);
  });
});

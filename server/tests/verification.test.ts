import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { Level } from "../src/generated/prisma/enums.js";

let code = "";
let codeId = 0;

beforeAll(async () => {
  const batch = await prisma.batch.create({ data: { name: "verification-test-batch" } });
  const rec = await prisma.activationCode.create({
    data: { batchId: batch.id, code: `V${Math.random().toString(36).slice(2, 9).toUpperCase()}`, maxTests: null }
  });
  code = rec.code;
  codeId = rec.id;
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { activationCodeId: codeId } });
  await prisma.activationCode.delete({ where: { id: codeId } });
  await prisma.batch.deleteMany({ where: { name: "verification-test-batch" } });
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

async function answer(app: ReturnType<typeof createApp>, sessionId: number, correct: boolean) {
  const correctIndex = await currentCorrectIndex(sessionId);
  const optionIndex = correct ? correctIndex : (correctIndex + 1) % 4;
  return request(app)
    .post(`/api/tests/${sessionId}/answer`)
    .set("x-access-code", code)
    .send({ optionIndex, answerTimeMs: 1000 });
}

describe("verification test", () => {
  it("passes K3 verification with 40/40 correct", async () => {
    const app = createApp();
    const start = await request(app)
      .post("/api/tests/verification/start")
      .set("x-access-code", code)
      .send({ level: "K3" });
    expect(start.body.code).toBe(0);
    const sessionId = start.body.data.sessionId;
    let finalRes: any = null;
    for (let i = 0; i < 40; i++) {
      finalRes = await answer(app, sessionId, true);
    }
    expect(finalRes.body.data.finished).toBe(true);
    const report = await request(app).get(`/api/reports/${sessionId}`).set("x-access-code", code);
    expect(report.body.data.passed).toBe(true);
    expect(report.body.data.finalLevel).toBe(Level.K3);
  });

  it("fails K3 verification with 30/40 correct", async () => {
    const app = createApp();
    const start = await request(app)
      .post("/api/tests/verification/start")
      .set("x-access-code", code)
      .send({ level: "K3" });
    const sessionId = start.body.data.sessionId;
    let finalRes: any = null;
    for (let i = 0; i < 40; i++) {
      finalRes = await answer(app, sessionId, i < 30);
    }
    expect(finalRes.body.data.finished).toBe(true);
    const report = await request(app).get(`/api/reports/${sessionId}`).set("x-access-code", code);
    expect(report.body.data.accuracy).toBeCloseTo(30 / 40, 2);
    expect(report.body.data.passed).toBe(false);
  });
});

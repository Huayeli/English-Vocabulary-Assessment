import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { Level } from "../src/generated/prisma/enums.js";

const ADMIN_KEY = "REDACTED";

function adminGet(app: ReturnType<typeof createApp>, url: string) {
  return request(app).get(url).set("x-admin-key", ADMIN_KEY);
}

let codeId = 0;
const GEN_BATCH = `生成批次-${Date.now()}`;

beforeAll(async () => {
  const existing = await prisma.activationCode.findUnique({ where: { code: "ADMINTEST" } });
  if (existing) {
    await prisma.testSession.deleteMany({ where: { activationCodeId: existing.id } });
    await prisma.activationCode.delete({ where: { id: existing.id } });
  }
  const existingBatch = await prisma.batch.findFirst({ where: { name: "admin-test-batch" } });
  if (existingBatch) {
    await prisma.activationCode.deleteMany({ where: { batchId: existingBatch.id } });
    await prisma.batch.delete({ where: { id: existingBatch.id } });
  }
  const batch = await prisma.batch.create({ data: { name: "admin-test-batch" } });
  const rec = await prisma.activationCode.create({
    data: { batchId: batch.id, code: "ADMINTEST", maxTests: null }
  });
  codeId = rec.id;
  const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
  await prisma.testSession.create({
    data: {
      activationCodeId: codeId,
      type: "ADAPTIVE",
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 1,
      finalLevel: Level.K3,
      estimatedVocabulary: 3000,
      finishedAt: new Date(),
      items: {
        create: [
          {
            seq: 1,
            wordId: word.id,
            testedLevel: Level.K3,
            optionsSnapshot: JSON.stringify(["a", "b", "c", "d"]),
            correctOptionIndex: 0,
            userOptionIndex: 0,
            isCorrect: true,
            answerTimeMs: 100
          }
        ]
      }
    }
  });
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { activationCodeId: codeId } });
  const genBatch = await prisma.batch.findFirst({ where: { name: GEN_BATCH } });
  if (genBatch) {
    await prisma.activationCode.deleteMany({ where: { batchId: genBatch.id } });
    await prisma.batch.delete({ where: { id: genBatch.id } });
  }
  const adminBatch = await prisma.batch.findFirst({ where: { name: "admin-test-batch" } });
  if (adminBatch) {
    await prisma.activationCode.deleteMany({ where: { batchId: adminBatch.id } });
    await prisma.batch.delete({ where: { id: adminBatch.id } });
  }
  await prisma.$disconnect();
});

describe("admin api", () => {
  it("requires admin key", async () => {
    const res = await request(createApp()).get("/api/admin/dashboard");
    expect(res.status).toBe(403);
  });

  it("returns dashboard stats", async () => {
    const res = await adminGet(createApp(), "/api/admin/dashboard");
    expect(res.body.code).toBe(0);
    expect(res.body.data.codeCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.testCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.levelDistribution).toHaveLength(6);
  });

  it("generates codes in batch and filters them", async () => {
    const app = createApp();
    const gen = await request(app)
      .post("/api/admin/codes/generate")
      .set("x-admin-key", ADMIN_KEY)
      .send({ batchName: GEN_BATCH, count: 5, maxTests: "" });
    expect(gen.body.code).toBe(0);
    expect(gen.body.data.count).toBe(5);
    expect(gen.body.data.codes).toHaveLength(5);

    const list = await adminGet(app, `/api/admin/codes?batch=${encodeURIComponent(GEN_BATCH)}&page=1&pageSize=20`);
    expect(list.body.data.total).toBe(5);
    expect(list.body.data.list[0].remaining).toBeNull();

    const id = list.body.data.list[0].id;
    const update = await request(app)
      .put(`/api/admin/codes/${id}`)
      .set("x-admin-key", ADMIN_KEY)
      .send({ status: "DISABLED", maxTests: 2 });
    expect(update.body.code).toBe(0);

    const batches = await adminGet(app, "/api/admin/batches");
    expect(batches.body.data.some((b: any) => b.name === GEN_BATCH)).toBe(true);
  });

  it("lists and details tests", async () => {
    const app = createApp();
    const list = await adminGet(app, "/api/admin/tests?keyword=ADMINTEST");
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.list[0].accessCode).toBe("ADMINTEST");
    expect(list.body.data.list[0].finishedAt).not.toBeNull();

    const detail = await adminGet(app, `/api/admin/tests/${list.body.data.list[0].id}`);
    expect(detail.body.data.items).toHaveLength(1);
  });
});

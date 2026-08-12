import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import { Level } from "../src/generated/prisma/enums.js";

let adminToken = "";
let userToken = "";
let testWordId = 0;
const TEST_WORD = "ztestword42";

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  await prisma.word.deleteMany({ where: { headword: { in: [TEST_WORD, "ztestmeaning1"] } } });
  const admin = await prisma.user.create({
    data: { username: "vocabadmin", passwordHash: "unused", role: "ADMIN", packageId: free.id }
  });
  const user = await prisma.user.create({
    data: { username: "vocabuser", passwordHash: "unused", packageId: free.id }
  });
  adminToken = signToken({ userId: admin.id, role: "ADMIN" });
  userToken = signToken({ userId: user.id, role: "USER" });
});

afterAll(async () => {
  if (testWordId) {
    await prisma.word.delete({ where: { id: testWordId } }).catch(() => undefined);
  }
  await prisma.user.deleteMany({ where: { username: { in: ["vocabadmin", "vocabuser"] } } });
  await prisma.$disconnect();
});

describe("vocabulary CRUD", () => {
  it("admin creates word with meanings", async () => {
    const res = await request(createApp())
      .post("/api/words")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        headword: TEST_WORD,
        level: "K3",
        bncLevel: "3k",
        relatedForms: "ztestword42, ztestwords42",
        meanings: ["测试义项一", "测试义项二"]
      });
    expect(res.body.code).toBe(0);
    expect(res.body.data.meanings).toHaveLength(2);
    testWordId = res.body.data.id;
  });

  it("normal user cannot create word", async () => {
    const res = await request(createApp())
      .post("/api/words")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ headword: "forbidden", level: "K1", bncLevel: "1k" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });

  it("searches word by keyword with meaning count", async () => {
    const res = await request(createApp())
      .get(`/api/words?keyword=${TEST_WORD}&page=1&pageSize=10`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].meaningCount).toBe(2);
  });

  it("filters words without meanings", async () => {
    const res = await request(createApp())
      .get(`/api/words?keyword=${TEST_WORD}&hasMeaning=false&page=1&pageSize=10`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.body.data.total).toBe(0);
  });

  it("deletes word and cascades meanings", async () => {
    const res = await request(createApp())
      .delete(`/api/words/${testWordId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.code).toBe(0);

    const detail = await request(createApp())
      .get(`/api/words/${testWordId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(detail.body.code).toBe(40401);

    const meanings = await prisma.wordMeaning.count({ where: { wordId: testWordId } });
    expect(meanings).toBe(0);
    testWordId = 0;
  });
});

describe("word meaning management", () => {
  it("adds, updates and deletes a meaning", async () => {
    const word = await prisma.word.create({
      data: { headword: "ztestmeaning1", level: Level.K1, bncLevel: "1k" }
    });
    const add = await request(createApp())
      .post(`/api/words/${word.id}/meanings`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ meaning: "初始释义" });
    expect(add.body.code).toBe(0);
    const meaningId = add.body.data.id;

    const update = await request(createApp())
      .put(`/api/meanings/${meaningId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ meaning: "更新释义" });
    expect(update.body.code).toBe(0);
    expect(update.body.data.meaning).toBe("更新释义");

    const del = await request(createApp())
      .delete(`/api/meanings/${meaningId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(del.body.code).toBe(0);

    await prisma.word.delete({ where: { id: word.id } });
  });
});

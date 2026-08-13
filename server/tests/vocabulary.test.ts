import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { Level } from "../src/generated/prisma/enums.js";

const ADMIN_KEY = "REDACTED";
const TEST_WORD = "ztestword42";
let testWordId = 0;

beforeAll(async () => {
  await prisma.word.deleteMany({ where: { headword: { in: [TEST_WORD, "ztestmeaning1"] } } });
});

afterAll(async () => {
  if (testWordId) {
    await prisma.word.delete({ where: { id: testWordId } }).catch(() => undefined);
  }
  await prisma.word.deleteMany({ where: { headword: { in: [TEST_WORD, "ztestmeaning1"] } } });
  await prisma.$disconnect();
});

function adminReq(app: ReturnType<typeof createApp>, method: "get" | "post" | "put" | "delete", url: string, body?: unknown) {
  const r = request(app)[method](url).set("x-admin-key", ADMIN_KEY);
  return body === undefined ? r : r.send(body);
}

describe("vocabulary CRUD", () => {
  it("requires admin key", async () => {
    const res = await request(createApp()).get("/api/words?page=1&pageSize=5");
    expect(res.status).toBe(403);
  });

  it("admin creates word with meanings", async () => {
    const res = await adminReq(createApp(), "post", "/api/words", {
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

  it("searches word by keyword with meaning count", async () => {
    const res = await adminReq(createApp(), "get", `/api/words?keyword=${TEST_WORD}&page=1&pageSize=10`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].meaningCount).toBe(2);
  });

  it("filters words without meanings", async () => {
    const res = await adminReq(createApp(), "get", `/api/words?keyword=${TEST_WORD}&hasMeaning=false&page=1&pageSize=10`);
    expect(res.body.data.total).toBe(0);
  });

  it("manages meanings then deletes word", async () => {
    const add = await adminReq(createApp(), "post", `/api/words/${testWordId}/meanings`, { meaning: "初始释义" });
    expect(add.body.code).toBe(0);
    const meaningId = add.body.data.id;

    const update = await adminReq(createApp(), "put", `/api/meanings/${meaningId}`, { meaning: "更新释义" });
    expect(update.body.data.meaning).toBe("更新释义");

    const delMeaning = await adminReq(createApp(), "delete", `/api/meanings/${meaningId}`);
    expect(delMeaning.body.code).toBe(0);

    const del = await adminReq(createApp(), "delete", `/api/words/${testWordId}`);
    expect(del.body.code).toBe(0);
    testWordId = 0;
  });

  it("creates word with level and lists it", async () => {
    const word = await prisma.word.create({ data: { headword: "ztestmeaning1", level: Level.K1, bncLevel: "1k" } });
    const res = await adminReq(createApp(), "get", "/api/words?keyword=ztestmeaning1&page=1&pageSize=10");
    expect(res.body.data.total).toBe(1);
    await prisma.word.delete({ where: { id: word.id } });
  });
});

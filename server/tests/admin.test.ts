import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";
import { Level } from "../src/generated/prisma/enums.js";

let adminToken = "";
let userToken = "";
let targetUserId = 0;
let createdQuestionId: number | null = null;
let testWordId = 0;

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  await prisma.user.deleteMany({ where: { username: { in: ["adminuser", "normaluser", "statuser"] } } });
  await prisma.word.deleteMany({ where: { headword: "zadminword1" } });
  const testWord = await prisma.word.create({
    data: {
      headword: "zadminword1",
      level: Level.K3,
      bncLevel: "3k",
      meanings: { create: [{ meaning: "管理员测试释义一", sortOrder: 0 }, { meaning: "管理员测试释义二", sortOrder: 1 }] }
    }
  });
  testWordId = testWord.id;
  const admin = await prisma.user.create({
    data: { username: "adminuser", passwordHash: "unused", role: "ADMIN", packageId: free.id }
  });
  const normal = await prisma.user.create({
    data: { username: "normaluser", passwordHash: "unused", packageId: free.id }
  });
  adminToken = signToken({ userId: admin.id, role: "ADMIN" });
  userToken = signToken({ userId: normal.id, role: "USER" });
  targetUserId = normal.id;
});

afterAll(async () => {
  if (createdQuestionId) {
    await prisma.question.delete({ where: { id: createdQuestionId } }).catch(() => undefined);
  }
  await prisma.word.delete({ where: { id: testWordId } }).catch(() => undefined);
  await prisma.testSession.deleteMany({ where: { userId: targetUserId } });
  await prisma.user.deleteMany({ where: { username: { in: ["adminuser", "normaluser", "statuser"] } } });
  await prisma.$disconnect();
});

describe("admin api", () => {
  it("blocks normal user", async () => {
    const res = await request(createApp())
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40301);
  });

  it("lists users with test counts", async () => {
    const word = await prisma.word.findUniqueOrThrow({ where: { headword: "abandon" } });
    await prisma.testSession.create({
      data: {
        userId: targetUserId,
        type: "ADAPTIVE",
        totalQuestions: 1,
        correctCount: 1,
        finalLevel: Level.K3,
        estimatedVocabulary: 3000,
        accuracy: 1,
        finishedAt: new Date(),
        items: {
          create: [
            {
              seq: 1,
              wordId: word.id,
              testedLevel: Level.K3,
              optionsSnapshot: JSON.stringify(["a", "b"]),
              correctOptionIndex: 0,
              userOptionIndex: 0,
              isCorrect: true,
              answerTimeMs: 100
            }
          ]
        }
      }
    });
    const res = await request(createApp())
      .get("/api/admin/users?keyword=normaluser")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.code).toBe(0);
    const row = res.body.data.list.find((u: any) => u.username === "normaluser");
    expect(row.testCount).toBe(1);
    expect(row.currentLevel).toBe(Level.K3);
  });

  it("adjusts user package", async () => {
    const monthly = await prisma.plan.findUniqueOrThrow({ where: { code: "MONTHLY" } });
    const res = await request(createApp())
      .put(`/api/admin/users/${targetUserId}/package`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ packageId: monthly.id, remainingTestCount: 0 }); // 不传到期时间，应自动补 30 天
    expect(res.body.code).toBe(0);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
    expect(user.packageId).toBe(monthly.id);
    expect(user.packageExpireTime).not.toBeNull();
    expect(user.packageExpireTime!.getTime()).toBeGreaterThan(Date.now());
  });

  it("creates and manages manual question", async () => {
    const word = await prisma.word.findUniqueOrThrow({ where: { id: testWordId } });
    const meaning = await prisma.wordMeaning.findFirstOrThrow({ where: { wordId: word.id } });
    const res = await request(createApp())
      .post("/api/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        wordId: word.id,
        correctMeaningId: meaning.id,
        options: [
          { text: "管理员测试释义一", isCorrect: true },
          { text: "干扰一", isCorrect: false },
          { text: "干扰二", isCorrect: false },
          { text: "干扰三", isCorrect: false }
        ]
      });
    expect(res.body.code).toBe(0);
    createdQuestionId = res.body.data.id;

    const update = await request(createApp())
      .put(`/api/admin/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ options: [
        { text: "管理员测试释义一", isCorrect: true },
        { text: "干扰一", isCorrect: false },
        { text: "干扰二", isCorrect: false },
        { text: "干扰三", isCorrect: false }
      ] });
    expect(update.body.code).toBe(0);
  });

  it("returns stats overview", async () => {
    const res = await request(createApp())
      .get("/api/admin/stats/overview")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.userCount).toBeGreaterThanOrEqual(3);
    expect(res.body.data.testCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.levelDistribution).toHaveLength(6);
  });
});

import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";

let userId = 0;
let token = "";

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  await prisma.user.deleteMany({ where: { username: "homeuser" } });
  const user = await prisma.user.create({
    data: { username: "homeuser", passwordHash: "unused", packageId: free.id }
  });
  userId = user.id;
  token = signToken({ userId: user.id, role: "USER" });
});

afterAll(async () => {
  await prisma.testSession.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("user home", () => {
  it("returns empty home for new user", async () => {
    const res = await request(createApp())
      .get("/api/user/home")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.testCount).toBe(0);
    expect(res.body.data.wrongWordCount).toBe(0);
    expect(res.body.data.currentLevel).toBeNull();
    expect(res.body.data.package.code).toBe("FREE");
  });

  it("updates profile avatar", async () => {
    const res = await request(createApp())
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ avatar: "https://example.com/avatar.png" });
    expect(res.body.code).toBe(0);
    expect(res.body.data.avatar).toBe("https://example.com/avatar.png");

    const me = await request(createApp())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.body.data.avatar).toBe("https://example.com/avatar.png");
  });

  it("lists plans publicly", async () => {
    const res = await request(createApp()).get("/api/plans");
    expect(res.body.code).toBe(0);
    expect(res.body.data.list.map((p: any) => p.code)).toEqual(["FREE", "SINGLE", "MONTHLY", "YEARLY"]);
  });

  it("returns my plan quota", async () => {
    const res = await request(createApp())
      .get("/api/user/plan")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.code).toBe(0);
    expect(res.body.data.packageCode).toBe("FREE");
    expect(res.body.data.remainingDailyTests).toBe(1);
  });
});

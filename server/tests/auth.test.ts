import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const hash = await bcrypt.hash("testpass123", 10);
  await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: { username: "testuser", passwordHash: hash, packageId: free.id }
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { in: ["testuser", "newbie"] } } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers, logs in and returns me", async () => {
    const app = createApp();
    const reg = await request(app).post("/api/auth/register").send({ username: "newbie", password: "secret123" });
    expect(reg.body.code).toBe(0);
    expect(reg.body.data.token).toBeTruthy();
    expect(reg.body.data.user.packageCode).toBe("FREE");

    const login = await request(app).post("/api/auth/login").send({ username: "newbie", password: "secret123" });
    expect(login.body.code).toBe(0);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.data.token}`);
    expect(me.body.data.username).toBe("newbie");
  });

  it("rejects wrong password", async () => {
    const res = await request(createApp()).post("/api/auth/login").send({ username: "testuser", password: "wrongpass" });
    expect(res.body.code).toBe(40102);
  });

  it("rejects duplicate username", async () => {
    const res = await request(createApp()).post("/api/auth/register").send({ username: "testuser", password: "secret123" });
    expect(res.body.code).toBe(40901);
  });

  it("requires auth for /me", async () => {
    const res = await request(createApp()).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(40101);
  });
});

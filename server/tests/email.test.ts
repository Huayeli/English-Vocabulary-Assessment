import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { prisma } from "../src/utils/prisma.js";
import { createApp } from "../src/app.js";
import { setTransporter } from "../src/modules/auth/email.service.js";

beforeAll(async () => {
  setTransporter(nodemailer.createTransport({ jsonTransport: true }));
});

async function createUser(username: string, email: string | null) {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  return prisma.user.create({
    data: {
      username,
      email,
      passwordHash: await bcrypt.hash("testpass123", 10),
      packageId: free.id
    }
  });
}

async function latestCode(email: string, purpose: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" }
  });
  if (!record) throw new Error("no code found");
  return record.code;
}

async function loginToken(username: string) {
  const res = await request(createApp()).post("/api/auth/login").send({ username, password: "testpass123" });
  if (res.body.code !== 0) throw new Error(`login failed for ${username}`);
  return res.body.data.token;
}

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { username: { in: ["mailuser1", "mailuser2", "mailuser3"] } }
  });
  await prisma.verificationCode.deleteMany({
    where: { email: { in: ["one@example.com", "two@example.com", "three@example.com"] } }
  });
  await prisma.$disconnect();
});

describe("email verification code", () => {
  it("sends code, rate limits, rejects wrong code, logs in with correct code", async () => {
    await createUser("mailuser1", "one@example.com");
    const app = createApp();

    const send = await request(app).post("/api/auth/email-code").send({ email: "one@example.com" });
    expect(send.body.code).toBe(0);

    const again = await request(app).post("/api/auth/email-code").send({ email: "one@example.com" });
    expect(again.body.code).toBe(40104);

    const wrong = await request(app)
      .post("/api/auth/login-by-email")
      .send({ email: "one@example.com", code: "000000" });
    expect(wrong.body.code).toBe(40103);

    const code = await latestCode("one@example.com", "LOGIN");
    const ok = await request(app)
      .post("/api/auth/login-by-email")
      .send({ email: "one@example.com", code });
    expect(ok.body.code).toBe(0);
    expect(ok.body.data.token).toBeTruthy();

    const record = await prisma.verificationCode.findFirst({
      where: { email: "one@example.com", purpose: "LOGIN", code },
      orderBy: { createdAt: "desc" }
    });
    expect(record?.used).toBe(true);
  });

  it("rejects email-code for unbound email", async () => {
    const res = await request(createApp()).post("/api/auth/email-code").send({ email: "nobody@example.com" });
    expect(res.body.code).toBe(40401);
  });

  it("resets password with email code", async () => {
    await createUser("mailuser2", "two@example.com");
    const app = createApp();

    const send = await request(app).post("/api/auth/reset-password-code").send({ email: "two@example.com" });
    expect(send.body.code).toBe(0);

    const code = await latestCode("two@example.com", "RESET");
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "two@example.com", code, newPassword: "newpass123" });
    expect(reset.body.code).toBe(0);

    const login = await request(app).post("/api/auth/login").send({ username: "mailuser2", password: "newpass123" });
    expect(login.body.code).toBe(0);
  });

  it("binds email after verification", async () => {
    await createUser("mailuser3", null);
    const token = await loginToken("mailuser3");
    const app = createApp();

    const send = await request(app)
      .post("/api/auth/bind-email-code")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "three@example.com" });
    expect(send.body.code).toBe(0);

    const code = await latestCode("three@example.com", "BIND");
    const bind = await request(app)
      .post("/api/auth/bind-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "three@example.com", code });
    expect(bind.body.code).toBe(0);
    expect(bind.body.data.email).toBe("three@example.com");
  });
});

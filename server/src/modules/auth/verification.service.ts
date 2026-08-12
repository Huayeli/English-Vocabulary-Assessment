import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { sendCode } from "./email.service.js";

export type CodePurpose = "LOGIN" | "BIND" | "RESET";

const CODE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueCode(email: string, purpose: CodePurpose) {
  const latest = await prisma.verificationCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" }
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RATE_LIMIT_MS) {
    throw new ApiError(40104, "发送过于频繁，请 60 秒后再试");
  }
  const code = generateCode();
  await prisma.verificationCode.create({
    data: { email, purpose, code, expireTime: new Date(Date.now() + CODE_TTL_MS) }
  });
  await sendCode(email, code);
}

export async function verifyCode(email: string, purpose: CodePurpose, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose, code, used: false },
    orderBy: { createdAt: "desc" }
  });
  if (!record || record.expireTime.getTime() < Date.now()) {
    throw new ApiError(40103, "验证码错误或已过期");
  }
  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } });
}

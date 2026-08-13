import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

export async function validateCode(code: string) {
  const raw = code.trim();
  const record = await prisma.activationCode.findUnique({ where: { code: raw } });
  if (!record) throw new ApiError(40401, "激活码不存在");
  if (record.status !== "ACTIVE") throw new ApiError(40302, "激活码已被禁用");
  if (record.maxTests != null && record.usedCount >= record.maxTests) {
    throw new ApiError(40302, "该激活码的测试次数已用完");
  }
  return {
    accessCode: record.code,
    usedCount: record.usedCount,
    maxTests: record.maxTests,
    remaining: record.maxTests == null ? null : Math.max(0, record.maxTests - record.usedCount)
  };
}

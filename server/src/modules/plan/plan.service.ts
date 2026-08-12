import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

export async function getQuota(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { package: true }
  });
  if (!user) throw new ApiError(40401, "用户不存在");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const finishedToday = await prisma.testSession.count({
    where: { userId, finishedAt: { not: null }, startedAt: { gte: today } }
  });
  const limit = user.package.dailyTestLimit;
  return {
    packageCode: user.package.code,
    packageName: user.package.name,
    packageExpireTime: user.packageExpireTime,
    remainingTestCount: user.remainingTestCount,
    remainingDailyTests: limit == null ? null : Math.max(0, limit - finishedToday),
    verificationEnabled: user.package.verificationEnabled,
    wrongBookEnabled: user.package.wrongBookEnabled,
    historyEnabled: user.package.historyEnabled
  };
}

function assertPackageActive(user: { packageExpireTime: Date | null; package: { code: string } }) {
  if (user.package.code !== "FREE" && user.package.code !== "SINGLE") {
    if (!user.packageExpireTime || user.packageExpireTime.getTime() < Date.now()) {
      throw new ApiError(40302, "套餐已过期");
    }
  }
}

export async function assertCanStartAdaptive(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { package: true } });
  const quota = await getQuota(userId);
  if (quota.packageCode === "FREE" && (quota.remainingDailyTests ?? 0) <= 0) {
    throw new ApiError(40302, "今日免费测试次数已用完");
  }
  if (quota.packageCode === "SINGLE" && user.remainingTestCount <= 0) {
    throw new ApiError(40302, "单次测试次数已用完");
  }
  assertPackageActive(user);
  if (quota.packageCode === "SINGLE") {
    await prisma.user.update({ where: { id: userId }, data: { remainingTestCount: { decrement: 1 } } });
  }
}

export async function refundSingleTest(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { package: true } });
  if (user.package.code === "SINGLE") {
    await prisma.user.update({ where: { id: userId }, data: { remainingTestCount: { increment: 1 } } });
  }
}

export async function assertFeature(userId: number, feature: "verification" | "wrongBook") {
  const quota = await getQuota(userId);
  assertPackageActive({ packageExpireTime: quota.packageExpireTime, package: { code: quota.packageCode } });
  const ok = feature === "verification" ? quota.verificationEnabled : quota.wrongBookEnabled;
  if (!ok) throw new ApiError(40302, "当前套餐未开通该功能");
}

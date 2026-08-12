import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import fs from "node:fs";
import path from "node:path";

export async function getHome(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { package: true }
  });
  const latest = await prisma.testSession.findFirst({
    where: { userId, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" }
  });
  const [testCount, wrongWordCount, recentTests] = await Promise.all([
    prisma.testSession.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.wrongWord.count({ where: { userId } }),
    prisma.testSession.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 5
    })
  ]);
  return {
    username: user.username,
    avatar: user.avatar,
    currentLevel: latest?.finalLevel ?? null,
    estimatedVocabulary: latest?.estimatedVocabulary ?? null,
    testCount,
    wrongWordCount,
    package: {
      code: user.package.code,
      name: user.package.name,
      expireTime: user.packageExpireTime
    },
    recentTests: recentTests.map((t) => ({
      id: t.id,
      type: t.type,
      finalLevel: t.finalLevel,
      accuracy: t.accuracy,
      finishedTime: t.finishedAt
    }))
  };
}

export async function updateProfile(userId: number, avatar?: string) {
  if (avatar !== undefined && typeof avatar !== "string") {
    throw new ApiError(40001, "头像参数无效");
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatar ?? null },
    include: { package: true }
  });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    packageCode: user.package.code,
    packageName: user.package.name
  };
}

export async function saveAvatar(userId: number, dataUrl: string) {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new ApiError(40001, "头像格式不正确，请上传 PNG 或 JPG 图片");
  const ext = match[1] === "png" ? "png" : "jpg";
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > 2 * 1024 * 1024) throw new ApiError(40001, "头像文件过大（最大 2MB）");
  const dir = path.resolve(process.cwd(), "uploads/avatars");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `avatar-${userId}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  const avatar = `/uploads/avatars/${filename}`;
  await prisma.user.update({ where: { id: userId }, data: { avatar } });
  return avatar;
}

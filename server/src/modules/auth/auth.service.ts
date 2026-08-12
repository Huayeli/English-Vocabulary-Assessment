import bcrypt from "bcryptjs";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";
import { signToken } from "../../utils/jwt.js";

export interface PublicUser {
  id: number;
  username: string;
  email: string | null;
  avatar: string | null;
  role: string;
  packageCode: string;
  packageName: string;
}

export function toPublicUser(user: {
  id: number;
  username: string;
  email: string | null;
  avatar: string | null;
  role: string;
  package: { code: string; name: string };
}): PublicUser {
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

export async function register(username: string, password: string, email?: string) {
  const name = username.trim();
  const mail = email?.trim().toLowerCase() || null;
  if (name.length < 2 || name.length > 20) {
    throw new ApiError(40001, "用户名长度需为 2-20 个字符");
  }
  if (password.length < 6) {
    throw new ApiError(40001, "密码长度至少 6 位");
  }
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username: name, passwordHash, email: mail, packageId: freePlan.id },
    include: { package: true }
  });
  return { token: signToken({ userId: user.id, role: user.role }), user: toPublicUser(user) };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username: username.trim() }, include: { package: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(40102, "用户名或密码错误");
  }
  if (user.status === "DISABLED") {
    throw new ApiError(40301, "账号已被禁用");
  }
  return { token: signToken({ userId: user.id, role: user.role }), user: toPublicUser(user) };
}

export async function me(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { package: true } });
  if (!user) throw new ApiError(40101, "未登录或 token 失效");
  return toPublicUser(user);
}

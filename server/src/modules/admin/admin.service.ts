import { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

export async function listUsers(params: { keyword?: string; packageCode?: string; page: number; pageSize: number }) {
  const where: Record<string, unknown> = {};
  if (params.keyword) {
    where.OR = [{ username: { contains: params.keyword } }, { email: { contains: params.keyword } }];
  }
  if (params.packageCode) where.package = { code: params.packageCode };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { package: true },
      orderBy: { id: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    })
  ]);
  const rows = await Promise.all(
    users.map(async (u) => {
      const [testCount, latest] = await Promise.all([
        prisma.testSession.count({ where: { userId: u.id, finishedAt: { not: null } } }),
        prisma.testSession.findFirst({
          where: { userId: u.id, finishedAt: { not: null } },
          orderBy: { finishedAt: "desc" }
        })
      ]);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        packageCode: u.package.code,
        testCount,
        currentLevel: latest?.finalLevel ?? null,
        status: u.status
      };
    })
  );
  return { list: rows, total, page: params.page, pageSize: params.pageSize };
}

export async function userDetail(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { package: true }
  });
  if (!user) throw new ApiError(40401, "用户不存在");
  const [testCount, recent] = await Promise.all([
    prisma.testSession.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.testSession.findMany({
      where: { userId, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 10
    })
  ]);
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    packageCode: user.package.code,
    packageName: user.package.name,
    packageExpireTime: user.packageExpireTime,
    remainingTestCount: user.remainingTestCount,
    testCount,
    recentTests: recent
  };
}

export async function setPackage(
  userId: number,
  data: { packageId: number; expireTime?: string | null; remainingTestCount?: number }
) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: data.packageId } });
  let expireTime = data.expireTime ? new Date(data.expireTime) : null;
  if (expireTime && Number.isNaN(expireTime.getTime())) expireTime = null;
  // 月卡/年卡未填到期时间时自动补一个周期，避免刚开通就被判过期
  if ((plan.code === "MONTHLY" || plan.code === "YEARLY") && !expireTime) {
    const days = plan.code === "MONTHLY" ? 30 : 365;
    expireTime = new Date(Date.now() + days * 24 * 3600 * 1000);
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      packageId: data.packageId,
      packageExpireTime: expireTime,
      remainingTestCount: data.remainingTestCount ?? 0
    }
  });
}

export async function listQuestions(params: { keyword?: string; level?: Level; page: number; pageSize: number }) {
  const where: Record<string, unknown> = {};
  if (params.keyword) where.word = { headword: { contains: params.keyword } };
  if (params.level) where.level = params.level;
  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      include: { word: true, options: { orderBy: { sortOrder: "asc" } } },
      orderBy: { id: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    })
  ]);
  return {
    list: questions.map((q) => ({
      id: q.id,
      headword: q.word.headword,
      level: q.level,
      source: q.source,
      disabled: q.disabled,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
    })),
    total,
    page: params.page,
    pageSize: params.pageSize
  };
}

export async function createQuestion(data: {
  wordId: number;
  correctMeaningId: number;
  options: { text: string; isCorrect: boolean }[];
}) {
  const word = await prisma.word.findUniqueOrThrow({ where: { id: data.wordId } });
  const meaning = await prisma.wordMeaning.findFirst({
    where: { id: data.correctMeaningId, wordId: data.wordId }
  });
  if (!meaning) throw new ApiError(40001, "正确答案释义不属于该单词");
  if (data.options.length !== 5 || data.options.filter((o) => o.isCorrect).length !== 1) {
    throw new ApiError(40001, "题目必须包含 5 个选项且恰好 1 个正确答案");
  }
  return prisma.question.create({
    data: {
      wordId: data.wordId,
      correctMeaningId: data.correctMeaningId,
      level: word.level,
      source: "MANUAL",
      options: {
        create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, sortOrder: i }))
      }
    },
    include: { options: true }
  });
}

export async function updateQuestion(
  id: number,
  data: { disabled?: boolean; options?: { text: string; isCorrect: boolean }[] }
) {
  if (data.options) {
    if (data.options.length !== 5 || data.options.filter((o) => o.isCorrect).length !== 1) {
      throw new ApiError(40001, "题目必须包含 5 个选项且恰好 1 个正确答案");
    }
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.questionOption.createMany({
      data: data.options.map((o, i) => ({ questionId: id, text: o.text, isCorrect: o.isCorrect, sortOrder: i }))
    });
  }
  return prisma.question.update({ where: { id }, data: { disabled: data.disabled } });
}

export async function deleteQuestion(id: number) {
  await prisma.question.delete({ where: { id } });
}

export async function statsOverview() {
  const [userCount, testCount, avg] = await Promise.all([
    prisma.user.count(),
    prisma.testSession.count({ where: { finishedAt: { not: null } } }),
    prisma.testSession.aggregate({ _avg: { estimatedVocabulary: true }, where: { finishedAt: { not: null } } })
  ]);
  const latestSessions = await prisma.testSession.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    distinct: ["userId"],
    select: { finalLevel: true }
  });
  const levelDistribution = (Object.keys(Level) as Level[]).map((level) => ({
    level,
    count: latestSessions.filter((s) => s.finalLevel === level).length
  }));
  return {
    userCount,
    testCount,
    averageVocabulary: Math.round(avg._avg.estimatedVocabulary ?? 0),
    levelDistribution
  };
}

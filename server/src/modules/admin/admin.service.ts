import { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = randomCode();
    const exists = await prisma.activationCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new ApiError(50001, "激活码生成失败，请重试");
}

export async function dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [codeCount, activeCodeCount, batchCount, testCount, avg, todayTests] = await Promise.all([
    prisma.activationCode.count(),
    prisma.activationCode.count({ where: { status: "ACTIVE" } }),
    prisma.batch.count(),
    prisma.testSession.count({ where: { finishedAt: { not: null } } }),
    prisma.testSession.aggregate({ _avg: { estimatedVocabulary: true }, where: { finishedAt: { not: null } } }),
    prisma.testSession.count({ where: { finishedAt: { not: null }, startedAt: { gte: today } } })
  ]);
  const latestSessions = await prisma.testSession.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    distinct: ["activationCodeId"],
    select: { finalLevel: true }
  });
  const levelDistribution = (Object.keys(Level) as Level[]).map((level) => ({
    level,
    count: latestSessions.filter((s) => s.finalLevel === level).length
  }));
  return {
    codeCount,
    activeCodeCount,
    batchCount,
    testCount,
    todayTests,
    averageVocabulary: Math.round(avg._avg.estimatedVocabulary ?? 0),
    levelDistribution
  };
}

export async function listCodes(params: {
  batch?: string;
  status?: string;
  keyword?: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.keyword) where.code = { contains: params.keyword.toUpperCase() };
  if (params.batch) where.batch = { name: params.batch };
  const [total, list] = await Promise.all([
    prisma.activationCode.count({ where }),
    prisma.activationCode.findMany({
      where,
      include: { batch: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    })
  ]);
  const ids = list.map((c) => c.id);
  const [grouped, latest] = await Promise.all([
    prisma.testSession.groupBy({
      by: ["activationCodeId"],
      _count: { _all: true },
      _avg: { accuracy: true },
      where: { activationCodeId: { in: ids }, finishedAt: { not: null } }
    }),
    prisma.testSession.findMany({
      where: { activationCodeId: { in: ids }, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      distinct: ["activationCodeId"],
      select: { activationCodeId: true, finalLevel: true, estimatedVocabulary: true }
    })
  ]);
  const statMap = new Map(grouped.map((g) => [g.activationCodeId, g]));
  const latestMap = new Map(latest.map((l) => [l.activationCodeId, l]));
  return {
    list: list.map((c) => ({
      id: c.id,
      code: c.code,
      batchName: c.batch.name,
      maxTests: c.maxTests,
      usedCount: c.usedCount,
      remaining: c.maxTests == null ? null : Math.max(0, c.maxTests - c.usedCount),
      status: c.status,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
      testCount: statMap.get(c.id)?._count._all ?? 0,
      avgAccuracy: statMap.get(c.id)?._avg.accuracy ?? null,
      latestLevel: latestMap.get(c.id)?.finalLevel ?? null,
      latestVocabulary: latestMap.get(c.id)?.estimatedVocabulary ?? null
    })),
    total,
    page: params.page,
    pageSize: params.pageSize
  };
}

export async function batchCodes(
  ids: number[],
  action: "delete" | "update",
  data?: { status?: string; maxTests?: number | null }
) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(40001, "请至少选择一个激活码");
  }
  if (action === "delete") {
    await prisma.testSession.deleteMany({ where: { activationCodeId: { in: ids } } });
    await prisma.activationCode.deleteMany({ where: { id: { in: ids } } });
    return { deleted: ids.length };
  }
  await prisma.activationCode.updateMany({
    where: { id: { in: ids } },
    data: {
      status: data?.status,
      maxTests: data?.maxTests === undefined ? undefined : data.maxTests == null ? null : Math.max(1, Math.floor(data.maxTests))
    }
  });
  return { updated: ids.length };
}

export async function generateCodes(data: {
  batchName: string;
  count: number;
  maxTests?: number | null;
  note?: string;
}) {
  const name = data.batchName.trim();
  if (!name) throw new ApiError(40001, "批次名称不能为空");
  const count = Math.floor(data.count);
  if (count < 1 || count > 100) throw new ApiError(40001, "生成数量需在 1-100 之间");
  const maxTests = data.maxTests == null ? null : Math.max(1, Math.floor(data.maxTests));
  const batch = await prisma.batch.create({ data: { name, note: data.note ?? null } });
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(await uniqueCode());
  }
  await prisma.activationCode.createMany({
    data: codes.map((code) => ({ batchId: batch.id, code, maxTests }))
  });
  return { batchId: batch.id, batchName: name, count, maxTests, codes };
}

export async function updateCode(id: number, data: { status?: string; maxTests?: number | null }) {
  return prisma.activationCode.update({
    where: { id },
    data: {
      status: data.status,
      maxTests: data.maxTests === undefined ? undefined : data.maxTests == null ? null : Math.max(1, Math.floor(data.maxTests))
    }
  });
}

export async function listBatches() {
  const batches = await prisma.batch.findMany({
    include: { _count: { select: { codes: true } } },
    orderBy: { createdAt: "desc" }
  });
  return batches.map((b) => ({
    id: b.id,
    name: b.name,
    note: b.note,
    codeCount: b._count.codes,
    createdAt: b.createdAt
  }));
}

export async function listTests(params: { type?: string; keyword?: string; page: number; pageSize: number }) {
  const where: Record<string, unknown> = { finishedAt: { not: null } };
  if (params.type) where.type = params.type;
  if (params.keyword) where.code = { code: { contains: params.keyword.toUpperCase() } };
  const [total, list] = await Promise.all([
    prisma.testSession.count({ where }),
    prisma.testSession.findMany({
      where,
      include: { code: true },
      orderBy: { finishedAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    })
  ]);
  return {
    list: list.map((t) => ({
      id: t.id,
      accessCode: t.code.code,
      type: t.type,
      totalQuestions: t.totalQuestions,
      correctCount: t.correctCount,
      accuracy: t.accuracy,
      finalLevel: t.finalLevel,
      estimatedVocabulary: t.estimatedVocabulary,
      startedAt: t.startedAt,
      finishedAt: t.finishedAt
    })),
    total,
    page: params.page,
    pageSize: params.pageSize
  };
}

export async function testDetail(id: number) {
  const session = await prisma.testSession.findUnique({
    where: { id },
    include: {
      code: true,
      items: { include: { word: true }, orderBy: { seq: "asc" } }
    }
  });
  if (!session) throw new ApiError(40401, "测试不存在");
  return session;
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
  if (data.options.length !== 4 || data.options.filter((o) => o.isCorrect).length !== 1) {
    throw new ApiError(40001, "题目必须包含 4 个选项且恰好 1 个正确答案");
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
    if (data.options.length !== 4 || data.options.filter((o) => o.isCorrect).length !== 1) {
      throw new ApiError(40001, "题目必须包含 4 个选项且恰好 1 个正确答案");
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

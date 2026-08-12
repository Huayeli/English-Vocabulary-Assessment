import type { Level } from "../../generated/prisma/enums.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/errors.js";

export async function listWords(params: {
  keyword?: string;
  level?: Level;
  hasMeaning?: boolean;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.keyword) where.headword = { contains: params.keyword };
  if (params.level) where.level = params.level;
  if (params.hasMeaning === true) where.meanings = { some: {} };
  if (params.hasMeaning === false) where.meanings = { none: {} };

  const [total, list] = await Promise.all([
    prisma.word.count({ where }),
    prisma.word.findMany({
      where,
      include: { _count: { select: { meanings: true } } },
      orderBy: { id: "asc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    })
  ]);

  const rows = list.map((w) => ({
    id: w.id,
    headword: w.headword,
    level: w.level,
    bncLevel: w.bncLevel,
    meaningCount: w._count.meanings,
    status: w.status
  }));

  return { list: rows, total, page: params.page, pageSize: params.pageSize };
}

export async function getWordDetail(id: number) {
  const word = await prisma.word.findUnique({
    where: { id },
    include: { meanings: { orderBy: { sortOrder: "asc" } } }
  });
  if (!word) throw new ApiError(40401, "单词不存在");
  return word;
}

export async function createWord(data: {
  headword: string;
  level: Level;
  bncLevel: string;
  relatedForms?: string;
  meanings?: string[];
}) {
  const headword = data.headword.trim();
  if (!headword) throw new ApiError(40001, "单词不能为空");
  const existing = await prisma.word.findUnique({ where: { headword } });
  if (existing) throw new ApiError(40901, "单词已存在");
  return prisma.word.create({
    data: {
      headword,
      level: data.level,
      bncLevel: data.bncLevel,
      relatedForms: data.relatedForms ?? null,
      meanings: data.meanings?.length
        ? { create: data.meanings.map((m, i) => ({ meaning: m, sortOrder: i })) }
        : undefined
    },
    include: { meanings: true }
  });
}

export async function updateWord(id: number, data: { level?: Level; relatedForms?: string; status?: string }) {
  await getWordDetail(id);
  return prisma.word.update({ where: { id }, data });
}

export async function deleteWord(id: number) {
  await getWordDetail(id);
  try {
    await prisma.word.delete({ where: { id } });
  } catch (e) {
    const anyErr = e as { code?: string };
    if (anyErr.code === "P2003") {
      throw new ApiError(40001, "该单词已被测试记录引用，无法删除，请改用停用状态");
    }
    throw e;
  }
}

export async function addMeaning(wordId: number, meaning: string) {
  await getWordDetail(wordId);
  const text = meaning.trim();
  if (!text) throw new ApiError(40001, "词义不能为空");
  return prisma.wordMeaning.create({ data: { wordId, meaning: text, sortOrder: 0 } });
}

export async function updateMeaning(id: number, meaning: string) {
  const text = meaning.trim();
  if (!text) throw new ApiError(40001, "词义不能为空");
  return prisma.wordMeaning.update({ where: { id }, data: { meaning: text } });
}

export async function deleteMeaning(id: number) {
  await prisma.wordMeaning.delete({ where: { id } });
}

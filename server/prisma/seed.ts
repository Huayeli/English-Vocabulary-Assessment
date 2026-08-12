import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import bcrypt from "bcryptjs";
import { prisma } from "../src/utils/prisma.js";
import { bncToLevel } from "../src/utils/level.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");

const POS_PREFIX = /^(a|abbr|ad|adj|adv|aux|conj|int|modal|n|num|phr|prep|pron|v|vi|vt)\.\s*/;
const MAX_MEANINGS_PER_WORD = 5;

export function parseMeanings(raw: string, limit = MAX_MEANINGS_PER_WORD): string[] {
  return raw
    .split(/\\n|\n/)
    .map((line) => line.replace(POS_PREFIX, "").trim())
    .map((line) => line.replace(/\r$/, "").trim())
    .map((line) => line.replace(/\[[^\]]*\]/g, "").trim()) // 去除 [计] [医] [化] 等学科标签
    .filter((line) => line.length > 0 && line.length <= 50)
    .filter((line, i, arr) => arr.indexOf(line) === i)
    .slice(0, limit);
}

async function loadEcdictIndex(csvPath: string): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const parser = fs.createReadStream(csvPath).pipe(parse({ columns: true, skip_empty_lines: true }));
  for await (const row of parser) {
    const word = (row.word ?? "").trim().toLowerCase();
    const translation = (row.translation ?? "").trim();
    if (word && translation) index.set(word, translation);
  }
  return index;
}

async function seedPlans() {
  const plans = [
    {
      code: "FREE",
      name: "免费体验",
      dailyTestLimit: 1,
      verificationEnabled: false,
      wrongBookEnabled: false,
      historyEnabled: false,
      reportLevel: "BASIC",
      priceCents: 0,
      sortOrder: 1
    },
    {
      code: "SINGLE",
      name: "单次测试",
      dailyTestLimit: null,
      verificationEnabled: false,
      wrongBookEnabled: false,
      historyEnabled: false,
      reportLevel: "FULL",
      priceCents: 100,
      sortOrder: 2
    },
    {
      code: "MONTHLY",
      name: "月卡",
      dailyTestLimit: null,
      verificationEnabled: true,
      wrongBookEnabled: true,
      historyEnabled: true,
      reportLevel: "FULL",
      priceCents: 3000,
      sortOrder: 3
    },
    {
      code: "YEARLY",
      name: "年卡",
      dailyTestLimit: null,
      verificationEnabled: true,
      wrongBookEnabled: true,
      historyEnabled: true,
      reportLevel: "FULL",
      priceCents: 30000,
      sortOrder: 4
    }
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { code: p.code }, update: p, create: p });
  }
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "REDACTED";
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (!exists) {
    await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        role: "ADMIN",
        packageId: free.id
      }
    });
  }
}

async function importWords() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "data/output.json"), "utf-8"));
  const ecdictCsv = path.join(ROOT, "data/ecdict.csv");
  if (!fs.existsSync(ecdictCsv)) {
    console.warn("WARNING: data/ecdict.csv not found, importing words without meanings.");
  }
  const ecdict = fs.existsSync(ecdictCsv) ? await loadEcdictIndex(ecdictCsv) : new Map<string, string>();

  // seed 是初始化脚本：词义完全由 ECDICT 重建，先清空旧词义保证幂等一致
  await prisma.wordMeaning.deleteMany({});

  let imported = 0;
  let withMeaning = 0;
  let skipped = 0;
  const missing: string[] = [];
  const importedEntries: { headword: string; wordId: number }[] = [];

  for (const entry of raw.entries) {
    let level;
    try {
      level = bncToLevel(entry.list);
    } catch {
      // 4k、6k-9k 词表不属于 6 个系统等级，跳过
      skipped += 1;
      continue;
    }
    const word = await prisma.word.upsert({
      where: { headword: entry.headword },
      update: { level, bncLevel: entry.list, relatedForms: entry.related_forms, status: "ENABLED" },
      create: {
        headword: entry.headword,
        level,
        bncLevel: entry.list,
        relatedForms: entry.related_forms
      }
    });
    importedEntries.push({ headword: entry.headword, wordId: word.id });
    imported += 1;
  }

  const existingMeanings = await prisma.wordMeaning.findMany({ select: { wordId: true, meaning: true } });
  const existingSet = new Set(existingMeanings.map((m) => `${m.wordId}|${m.meaning}`));
  const toCreate: { wordId: number; meaning: string; sortOrder: number }[] = [];

  for (const entry of importedEntries) {
    const translation = ecdict.get(entry.headword.toLowerCase()) ?? "";
    const meanings = parseMeanings(translation);
    if (meanings.length > 0) withMeaning += 1;
    else missing.push(entry.headword);
    meanings.forEach((meaning, i) => {
      if (!existingSet.has(`${entry.wordId}|${meaning}`)) {
        toCreate.push({ wordId: entry.wordId, meaning, sortOrder: i });
      }
    });
  }

  for (let i = 0; i < toCreate.length; i += 500) {
    await prisma.wordMeaning.createMany({ data: toCreate.slice(i, i + 500) });
  }

  console.log(`imported: ${imported}`);
  console.log(`skipped (not in 6-level system): ${skipped}`);
  console.log(`with meaning: ${withMeaning}`);
  console.log(`missing meaning: ${missing.length}`);
  console.log(`meanings created: ${toCreate.length}`);
}

async function main() {
  await seedPlans();
  await seedAdmin();
  await importWords();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

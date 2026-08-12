# 英语词汇量智能评估系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零实现一个基于 BNC/COCA 词频等级的英语词汇量智能评估系统（Vue3 + Express + SQLite/Prisma），包含自适应测试、等级验证、报告、错词本、套餐权限与管理后台。

**Architecture:** 前后端分离：`server/` 为 Express + TypeScript + Prisma 单体应用，按业务模块（auth、vocabulary、question、test、report、wrong-word、plan、admin）划分；`client/` 为 Vue3 + TS + Pinia 单页应用。所有权限与套餐限制在服务端强制校验，题目与答题明细做快照化存储。

**Tech Stack:** Vue 3、TypeScript、Vite、Pinia、Vue Router、Axios；Node.js、Express、Prisma、SQLite、jsonwebtoken、bcryptjs、nodemailer；Vitest + Supertest。

**前置约定：**

- 所有 shell 命令在项目根目录执行（PowerShell）。
- 环境变量统一放 `server/.env`（参考 `server/.env.example`），测试环境用 `server/.env.test` 指向独立的 SQLite 文件。
- 数据库字段名遵循 `docs/03-database.md` 的字段字典（Prisma 中 camelCase，通过 `@map` 映射为 snake_case）。
- 每个任务结束必须跑通该任务的测试并提交 git（Task 1 会初始化仓库）。
- 接口契约以 `docs/04-api.md` 为准。

---

## P0：项目脚手架与词库导入

### Task 1: 初始化 server 工程与测试框架

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`
- Create: `server/vitest.config.ts`
- Create: `server/tests/smoke.test.ts`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 git 与目录**

```powershell
git init
New-Item -ItemType Directory -Force server, server\src, server\tests | Out-Null
```

- [ ] **Step 2: 创建 package.json 与依赖**

`server/package.json`：

```json
{
  "name": "vocab-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "seed": "tsx prisma/seed.ts"
  }
}
```

安装依赖：

```powershell
Set-Location server
npm install express cors jsonwebtoken bcryptjs nodemailer zod dotenv @prisma/client
npm install -D typescript tsx vitest supertest @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/nodemailer @types/node @types/supertest prisma
Set-Location ..
```

预期：`npm install` 成功，无报错。

- [ ] **Step 3: TypeScript 配置**

`server/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src", "prisma", "tests"]
}
```

- [ ] **Step 4: 最小应用与健康检查**

`server/src/app.ts`：

```typescript
import express from "express";
import cors from "cors";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.json({ code: 0, message: "ok", data: { status: "up" } });
  });
  return app;
}
```

`server/src/index.ts`：

```typescript
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);
createApp().listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
```

- [ ] **Step 5: 编写冒烟测试**

`server/vitest.config.ts`：

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["dotenv/config"]
  }
});
```

`server/tests/smoke.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("smoke", () => {
  it("GET /health returns ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ code: 0, data: { status: "up" } });
  });
});
```

- [ ] **Step 6: 运行测试确认通过**

```powershell
Set-Location server
npm test
Set-Location ..
```

预期：`Test Files 1 passed`，`Tests 1 passed`。

- [ ] **Step 7: 提交**

```powershell
git add .
git commit -m "chore: init server scaffold with express and vitest"
```

### Task 2: Prisma 数据模型与初始迁移

**Files:**
- Create: `server/.env`
- Create: `server/.env.example`（更新）
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: 配置环境变量**

`server/.env` 与 `server/.env.example`：

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
SMTP_HOST="smtp.163.com"
SMTP_PORT=465
SMTP_USER="your_account@163.com"
SMTP_PASS="your_smtp_auth_code"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="REDACTED"
```

- [ ] **Step 2: 编写完整 schema**

`server/prisma/schema.prisma`（完整内容）：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Level {
  K1
  K2
  K3
  K5
  K10
  K10P
}

model User {
  id                 Int       @id @default(autoincrement())
  username           String    @unique
  passwordHash       String    @map("password_hash")
  email              String?   @unique
  avatar             String?
  packageId          Int       @map("package_id")
  packageExpireTime  DateTime? @map("package_expire_time")
  remainingTestCount Int       @default(0) @map("remaining_test_count")
  status             String    @default("NORMAL")
  createdAt          DateTime  @default(now()) @map("created_time")
  updatedAt          DateTime  @updatedAt @map("updated_time")

  package        Plan               @relation(fields: [packageId], references: [id])
  testSessions   TestSession[]
  wrongWords     WrongWord[]

  @@index([packageId])
}

model VerificationCode {
  id          Int      @id @default(autoincrement())
  email       String
  purpose     String
  code        String
  expireTime  DateTime @map("expire_time")
  used        Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_time")

  @@index([email, purpose])
}

model Plan {
  id                   Int     @id @default(autoincrement())
  code                 String  @unique
  name                 String
  dailyTestLimit       Int?
  verificationEnabled  Boolean @default(false)
  wrongBookEnabled     Boolean @default(false)
  historyEnabled       Boolean @default(false)
  reportLevel          String  @default("BASIC")
  priceCents           Int     @default(0)
  sortOrder            Int

  users User[]
}

model Word {
  id           Int      @id @default(autoincrement())
  headword     String   @unique
  level        Level
  bncLevel     String   @map("bnc_level")
  relatedForms String?  @map("related_forms")
  status       String   @default("ENABLED")
  createdAt    DateTime @default(now()) @map("created_time")
  updatedAt    DateTime @updatedAt @map("updated_time")

  meanings      WordMeaning[]
  questions     Question[]
  testItems     TestSessionItem[]
  wrongWords    WrongWord[]

  @@index([level])
}

model WordMeaning {
  id        Int    @id @default(autoincrement())
  wordId    Int    @map("word_id")
  meaning   String
  sortOrder Int    @default(0)

  word      Word             @relation(fields: [wordId], references: [id], onDelete: Cascade)
  questions Question[]
  options   QuestionOption[]

  @@unique([wordId, meaning])
  @@index([wordId])
}

model Question {
  id               Int      @id @default(autoincrement())
  wordId           Int      @map("word_id")
  correctMeaningId Int      @map("correct_meaning_id")
  level            Level
  source           String   @default("GENERATED")
  disabled         Boolean  @default(false)
  createdAt        DateTime @default(now()) @map("created_time")
  updatedAt        DateTime @updatedAt @map("updated_time")

  word       Word             @relation(fields: [wordId], references: [id], onDelete: Cascade)
  correctMeaning WordMeaning  @relation(fields: [correctMeaningId], references: [id], onDelete: Cascade)
  options    QuestionOption[]

  @@unique([wordId, correctMeaningId])
  @@index([level])
}

model QuestionOption {
  id         Int     @id @default(autoincrement())
  questionId Int     @map("question_id")
  meaningId  Int?    @map("meaning_id")
  text       String
  isCorrect  Boolean
  sortOrder  Int

  question Question            @relation(fields: [questionId], references: [id], onDelete: Cascade)
  meaning  WordMeaning?        @relation(fields: [meaningId], references: [id], onDelete: SetNull)

  @@index([questionId])
}

model TestSession {
  id                   Int       @id @default(autoincrement())
  userId               Int       @map("user_id")
  type                 String
  targetLevel          Level?
  totalQuestions       Int       @default(30)
  correctCount         Int       @default(0)
  wrongCount           Int       @default(0)
  finalLevel           Level?
  estimatedVocabulary  Int?      @map("estimated_vocabulary")
  accuracy             Float?
  startedAt            DateTime  @default(now()) @map("started_time")
  finishedAt           DateTime? @map("finished_time")

  user  User              @relation(fields: [userId], references: [id])
  items TestSessionItem[]

  @@index([userId, startedAt])
  @@index([type])
}

model TestSessionItem {
  id                  Int      @id @default(autoincrement())
  sessionId           Int      @map("session_id")
  seq                 Int
  wordId              Int      @map("word_id")
  testedLevel         Level    @map("tested_level")
  optionsSnapshot     String   @map("options_snapshot")
  correctOptionIndex  Int      @map("correct_option_index")
  userOptionIndex     Int?     @map("user_option_index")
  isCorrect           Boolean
  answerTimeMs        Int      @default(0) @map("answer_time_ms")
  createdAt           DateTime @default(now()) @map("created_time")

  session TestSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  word    Word        @relation(fields: [wordId], references: [id])

  @@index([sessionId])
}

model WrongWord {
  id                   Int      @id @default(autoincrement())
  userId               Int      @map("user_id")
  wordId               Int      @map("word_id")
  correctMeaningText   String   @map("correct_meaning_text")
  errorCount           Int      @default(1)
  lastErrorAt          DateTime @default(now()) @map("last_error_time")
  createdAt            DateTime @default(now()) @map("created_time")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  word Word @relation(fields: [wordId], references: [id], onDelete: Cascade)

  @@unique([userId, wordId])
  @@index([userId])
}
```

- [ ] **Step 3: 执行初始迁移并生成 Client**

```powershell
Set-Location server
npx prisma migrate dev --name init
npx prisma generate
Set-Location ..
```

预期：迁移成功，`server/prisma/dev.db` 生成，无 schema 错误。

- [ ] **Step 4: 提交**

```powershell
git add .
git commit -m "feat: add prisma schema with all 10 tables"
```

### Task 3: 词库导入脚本（BNC/COCA + ECDICT）

**Files:**
- Create: `server/src/utils/level.ts`
- Create: `server/prisma/seed.ts`
- Modify: `server/.env.example`（增加 `ECDICT_PATH` 可选配置）

- [ ] **Step 1: 等级映射工具**

`server/src/utils/level.ts`：

```typescript
import { Level } from "@prisma/client";

const MAP: Record<string, Level> = {
  "1k": Level.K1,
  "2k": Level.K2,
  "3k": Level.K3,
  "5k": Level.K5,
  "10k": Level.K10
};

export function bncToLevel(bnc: string): Level {
  const n = parseInt(bnc.replace("k", ""), 10);
  if (n >= 11) return Level.K10P;
  const level = MAP[bnc];
  if (!level) throw new Error(`unknown bnc level: ${bnc}`);
  return level;
}

export const LEVEL_RANK: Record<Level, number> = {
  [Level.K1]: 1,
  [Level.K2]: 2,
  [Level.K3]: 3,
  [Level.K5]: 5,
  [Level.K10]: 10,
  [Level.K10P]: 10
};
```

- [ ] **Step 2: ECDICT 释义清洗函数**

在 `server/prisma/seed.ts` 中定义：

```typescript
const POS_PREFIX = /^(n|v|vt|vi|adj|adv|prep|conj|pron|num|art|int|aux|modal|phr)\.\s*/;

export function parseMeanings(raw: string, limit = 5): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(POS_PREFIX, "").trim())
    .filter((line) => line.length > 0 && line.length <= 50)
    .filter((line, i, arr) => arr.indexOf(line) === i)
    .slice(0, limit);
}
```

- [ ] **Step 3: 下载并解析 ECDICT CSV**

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv" -OutFile "data\ecdict.csv"
Set-Location server
npm install csv-parse
Set-Location ..
```

预期：`data/ecdict.csv` 下载完成（约 65MB），`csv-parse` 安装成功。CSV 字段含逗号转义，必须用 `csv-parse` 解析（不能按逗号 split）。

读取函数（基于 `csv-parse`）：

```typescript
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { PrismaClient, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";
import { bncToLevel } from "../src/utils/level.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function loadEcdictIndex(csvPath: string): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const parser = fs.createReadStream(csvPath).pipe(
    parse({ columns: true, skip_empty_lines: true })
  );
  for await (const row of parser) {
    const word = (row.word ?? "").trim().toLowerCase();
    const translation = (row.translation ?? "").trim();
    if (word && translation) index.set(word, translation);
  }
  return index;
}
```

- [ ] **Step 4: 种子主流程（幂等）**

```typescript
async function seedPlans() {
  const plans = [
    { code: "FREE", name: "免费体验", dailyTestLimit: 1, verificationEnabled: false, wrongBookEnabled: false, historyEnabled: false, reportLevel: "BASIC", priceCents: 0, sortOrder: 1 },
    { code: "SINGLE", name: "单次测试", dailyTestLimit: null, verificationEnabled: false, wrongBookEnabled: false, historyEnabled: false, reportLevel: "FULL", priceCents: 100, sortOrder: 2 },
    { code: "MONTHLY", name: "月卡", dailyTestLimit: null, verificationEnabled: true, wrongBookEnabled: true, historyEnabled: true, reportLevel: "FULL", priceCents: 3000, sortOrder: 3 },
    { code: "YEARLY", name: "年卡", dailyTestLimit: null, verificationEnabled: true, wrongBookEnabled: true, historyEnabled: true, reportLevel: "FULL", priceCents: 30000, sortOrder: 4 }
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
```

> 说明：User 表新增 `role` 字段（String，默认 "USER"），在 `schema.prisma` 的 User model 中补充后再执行本任务：

```prisma
role String @default("USER")
```

需同时执行 `npx prisma migrate dev --name add_user_role`。

- [ ] **Step 5: 导入词库主函数**

```typescript
async function importWords() {
  const root = path.resolve(__dirname, "../../data");
  const raw = JSON.parse(fs.readFileSync(path.join(root, "output.json"), "utf-8"));
  const ecdict = await loadEcdictIndex(path.join(root, "ecdict.csv"));
  let imported = 0;
  let withMeaning = 0;
  const missing: string[] = [];
  for (const entry of raw.entries) {
    const level = bncToLevel(entry.list);
    const meanings = parseMeanings(ecdict.get(entry.headword.toLowerCase()) ?? "");
    await prisma.word.upsert({
      where: { headword: entry.headword },
      update: { level, bncLevel: entry.list, relatedForms: entry.related_forms, status: "ENABLED" },
      create: {
        headword: entry.headword,
        level,
        bncLevel: entry.list,
        relatedForms: entry.related_forms
      }
    });
    if (meanings.length > 0) {
      withMeaning += 1;
      for (const [i, meaning] of meanings.entries()) {
        const word = await prisma.word.findUniqueOrThrow({ where: { headword: entry.headword } });
        const exists = await prisma.wordMeaning.findFirst({ where: { wordId: word.id, meaning } });
        if (!exists) {
          await prisma.wordMeaning.create({
            data: { wordId: word.id, meaning, sortOrder: i }
          });
        }
      }
    } else {
      missing.push(entry.headword);
    }
    imported += 1;
  }
  console.log(`imported: ${imported}`);
  console.log(`with meaning: ${withMeaning}`);
  console.log(`missing meaning: ${missing.length}`);
}
```

> 说明：逐条 upsert 25,000 词较慢，MVP 可接受；如需提速，先按 headword 批量读回 `wordId`，再收集词义批量 `createMany`。实现时以"可重复执行且不产生重复词义"为准。

- [ ] **Step 6: 运行种子并验证**

```powershell
Set-Location server
npm run seed
Set-Location ..
```

预期输出：

```text
imported: 25002
with meaning: >20000（具体数量取决于 ECDICT 覆盖）
missing meaning: 若干（>0 正常）
```

校验语句（PowerShell + Prisma 查询或 sqlite3）：

```powershell
Set-Location server
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.word.count().then(c => console.log('words:', c)).finally(() => p.$disconnect())"
Set-Location ..
```

预期：`words: 25002`。

- [ ] **Step 7: 提交**

```powershell
git add .
git commit -m "feat: seed word bank from BNC/COCA and ECDICT"
```

### Task 4: 初始化 client 工程

**Files:**
- Create: `client/`（Vite vue-ts 模板）
- Create: `client/src/api/http.ts`
- Create: `client/src/router/index.ts`（骨架）

- [ ] **Step 1: 创建 Vite 项目**

```powershell
npm create vite@latest client -- --template vue-ts
Set-Location client
npm install
npm install vue-router@4 pinia axios
Set-Location ..
```

预期：`client/` 生成并可构建。

- [ ] **Step 2: 配置代理与 API 封装**

`client/vite.config.ts` 增加代理：

```typescript
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": "http://localhost:3000"
    }
  }
});
```

`client/src/api/http.ts`：

```typescript
import axios from "axios";

export const http = axios.create({ baseURL: "/api" });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 0) return Promise.reject(new Error(res.data?.message ?? "请求失败"));
    return res.data.data;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
```

- [ ] **Step 3: 路由骨架**

`client/src/router/index.ts`：

```typescript
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../views/auth/Login.vue") },
    { path: "/", component: () => import("../views/test/TestCenter.vue") },
    { path: "/user", component: () => import("../views/user/UserHome.vue") }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (!token && to.path !== "/login") return "/login";
  return true;
});

export default router;
```

先放置三个最小页面组件（登录页、测试中心、用户主页各一个带标题的空页面），保证构建通过。

- [ ] **Step 4: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
```

预期：`vue-tsc` 与 `vite build` 均通过。

```powershell
git add .
git commit -m "feat: init client scaffold with router and http wrapper"
```

---

## P1：认证与邮箱验证码

### Task 5: 注册 / 登录 / JWT

**Files:**
- Create: `server/src/utils/jwt.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/auth.test.ts`

- [ ] **Step 1: JWT 工具**

`server/src/utils/jwt.ts`：

```typescript
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET ?? "dev-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as JwtPayload;
}
```

- [ ] **Step 2: 认证中间件**

`server/src/middleware/auth.ts`：

```typescript
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ code: 40101, message: "未登录或 token 失效", data: null });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ code: 40101, message: "未登录或 token 失效", data: null });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ code: 40301, message: "无管理员权限", data: null });
    return;
  }
  next();
}
```

- [ ] **Step 3: 认证服务**

`server/src/modules/auth/auth.service.ts`：

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "../../utils/jwt.js";

const prisma = new PrismaClient();

export async function register(username: string, password: string, email?: string) {
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash, email: email || null, packageId: freePlan.id }
  });
  return { token: signToken({ userId: user.id, role: user.role }), user };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw Object.assign(new Error("用户名或密码错误"), { code: 40102 });
  }
  if (user.status === "DISABLED") {
    throw Object.assign(new Error("账号已被禁用"), { code: 40301 });
  }
  return { token: signToken({ userId: user.id, role: user.role }), user };
}
```

> 注意：`user.role` 依赖 Task 3 Step 4 中补充的 `role` 字段。

- [ ] **Step 4: 控制器与路由**

`server/src/modules/auth/auth.controller.ts` 提供 `registerHandler`、`loginHandler`、`meHandler`，统一捕获 service 抛出的 `{ code, message }` 错误；`auth.routes.ts` 挂载：

```typescript
import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();
authRouter.post("/register", ctrl.registerHandler);
authRouter.post("/login", ctrl.loginHandler);
authRouter.get("/me", requireAuth, ctrl.meHandler);
```

错误处理统一在 `app.ts` 末尾注册：

```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const code = err.code ?? 50000;
  res.status(code >= 40000 && code < 50000 ? 400 : 500).json({ code, message: err.message, data: null });
});
```

`app.ts` 挂载：`app.use("/api/auth", authRouter)`。

- [ ] **Step 5: 测试**

`server/tests/auth.test.ts`：

```typescript
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";

const prisma = new PrismaClient();

beforeAll(async () => {
  const free = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: { username: "testuser", passwordHash: "$2a$10$invalid", packageId: free.id }
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: "testuser" } });
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers and logs in", async () => {
    const app = createApp();
    const reg = await request(app).post("/api/auth/register").send({ username: "newbie", password: "secret123" });
    expect(reg.body.code).toBe(0);
    expect(reg.body.data.token).toBeTruthy();

    const login = await request(app).post("/api/auth/login").send({ username: "newbie", password: "secret123" });
    expect(login.body.code).toBe(0);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.data.token}`);
    expect(me.body.data.username).toBe("newbie");

    await prisma.user.deleteMany({ where: { username: "newbie" } });
  });

  it("rejects wrong password", async () => {
    const res = await request(createApp()).post("/api/auth/login").send({ username: "testuser", password: "wrong" });
    expect(res.body.code).toBe(40102);
  });
});
```

运行 `npm test`，预期 2 个用例通过。提交：

```powershell
git add .
git commit -m "feat: register, login and jwt auth"
```

### Task 6: 邮箱验证码（163 SMTP）

**Files:**
- Create: `server/src/modules/auth/email.service.ts`
- Create: `server/src/modules/auth/verification.service.ts`
- Modify: `server/src/modules/auth/auth.controller.ts`、`auth.routes.ts`
- Create: `server/tests/email.test.ts`

- [ ] **Step 1: SMTP 发送服务（可注入 fake）**

`server/src/modules/auth/email.service.ts`：

```typescript
import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function setTransporter(t: Transporter) {
  transporter = t;
}

function defaultTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.163.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER ?? "", pass: process.env.SMTP_PASS ?? "" }
  });
}

export async function sendCode(email: string, code: string) {
  const t = transporter ?? defaultTransporter();
  await t.sendMail({
    from: process.env.SMTP_USER ?? "",
    to: email,
    subject: "【词汇量评估系统】验证码",
    text: `您的验证码是：${code}，5 分钟内有效。若非本人操作请忽略。`
  });
}
```

- [ ] **Step 2: 验证码服务（限频 / 过期 / 一次性）**

`server/src/modules/auth/verification.service.ts`：

```typescript
import { PrismaClient } from "@prisma/client";
import { sendCode } from "./email.service.js";

const prisma = new PrismaClient();
const CODE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueCode(email: string, purpose: "LOGIN" | "BIND" | "RESET") {
  const latest = await prisma.verificationCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" }
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RATE_LIMIT_MS) {
    throw Object.assign(new Error("发送过于频繁，请 60 秒后再试"), { code: 40104 });
  }
  const code = generateCode();
  await prisma.verificationCode.create({
    data: { email, purpose, code, expireTime: new Date(Date.now() + CODE_TTL_MS) }
  });
  await sendCode(email, code);
}

export async function verifyCode(email: string, purpose: "LOGIN" | "BIND" | "RESET", code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose, code, used: false },
    orderBy: { createdAt: "desc" }
  });
  if (!record || record.expireTime.getTime() < Date.now()) {
    throw Object.assign(new Error("验证码错误或已过期"), { code: 40103 });
  }
  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } });
}
```

- [ ] **Step 3: 扩展认证服务**

新增服务方法：

```typescript
export async function loginByEmail(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error("该邮箱未绑定账号"), { code: 40401 });
  await verifyCode(email, "LOGIN", code);
  return { token: signToken({ userId: user.id, role: user.role }), user };
}

export async function bindEmail(userId: number, email: string, code: string) {
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== userId) throw Object.assign(new Error("邮箱已被绑定"), { code: 40902 });
  await verifyCode(email, "BIND", code);
  return prisma.user.update({ where: { id: userId }, data: { email } });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error("该邮箱未绑定账号"), { code: 40401 });
  await verifyCode(email, "RESET", code);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
```

对应路由：

```typescript
authRouter.post("/email-code", ctrl.emailCodeHandler);            // 校验邮箱已绑定后 issueCode(LOGIN)
authRouter.post("/login-by-email", ctrl.loginByEmailHandler);
authRouter.post("/bind-email-code", requireAuth, ctrl.bindEmailCodeHandler); // issueCode(BIND)
authRouter.post("/bind-email", requireAuth, ctrl.bindEmailHandler);
authRouter.post("/reset-password-code", ctrl.resetPasswordCodeHandler);     // issueCode(RESET)
authRouter.post("/reset-password", ctrl.resetPasswordHandler);
```

- [ ] **Step 4: 测试（注入 fake transporter）**

`server/tests/email.test.ts` 使用 `nodemailer.createTransport({ jsonTransport: true })` 或内存 fake，断言：

1. 首次发送验证码成功（`code: 0`）。
2. 60 秒内重复发送返回 `40104`。
3. 错误验证码登录返回 `40103`。
4. 正确验证码登录成功，且验证码标记 `used=true`。

```typescript
import { setTransporter } from "../src/modules/auth/email.service.js";
import nodemailer from "nodemailer";

beforeAll(() => {
  setTransporter(nodemailer.createTransport({ jsonTransport: true }));
});
```

运行 `npm test` 预期全部通过。提交：

```powershell
git add .
git commit -m "feat: email verification code with smtp and rate limit"
```

---

## P2：词库与词义管理

### Task 7: 单词与词义 CRUD 接口

**Files:**
- Create: `server/src/modules/vocabulary/vocabulary.service.ts`
- Create: `server/src/modules/vocabulary/vocabulary.controller.ts`
- Create: `server/src/modules/vocabulary/vocabulary.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/vocabulary.test.ts`

- [ ] **Step 1: 查询服务**

`server/src/modules/vocabulary/vocabulary.service.ts`（核心查询部分）：

```typescript
import { Level, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listWords(params: {
  keyword?: string;
  level?: Level;
  hasMeaning?: boolean;
  page: number;
  pageSize: number;
}) {
  const where: any = {};
  if (params.keyword) where.headword = { contains: params.keyword };
  if (params.level) where.level = params.level;
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
  let rows = list.map((w) => ({
    id: w.id,
    headword: w.headword,
    level: w.level,
    bncLevel: w.bncLevel,
    meaningCount: w._count.meanings,
    status: w.status
  }));
  if (params.hasMeaning === true) rows = rows.filter((r) => r.meaningCount > 0);
  if (params.hasMeaning === false) rows = rows.filter((r) => r.meaningCount === 0);
  return { list: rows, total, page: params.page, pageSize: params.pageSize };
}

export async function getWordDetail(id: number) {
  const word = await prisma.word.findUnique({
    where: { id },
    include: { meanings: { orderBy: { sortOrder: "asc" } } }
  });
  if (!word) throw Object.assign(new Error("单词不存在"), { code: 40401 });
  return word;
}
```

> 说明：`hasMeaning` 按 meaningCount 过滤在内存中进行，数据量 25k 可接受；如后续量级增大，改为 SQL 子查询。

- [ ] **Step 2: 写入服务**

同一文件追加：

```typescript
export async function createWord(data: {
  headword: string;
  level: Level;
  bncLevel: string;
  relatedForms?: string;
  meanings?: string[];
}) {
  const existing = await prisma.word.findUnique({ where: { headword: data.headword } });
  if (existing) throw Object.assign(new Error("单词已存在"), { code: 40901 });
  return prisma.word.create({
    data: {
      headword: data.headword,
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
  await prisma.word.delete({ where: { id } }); // 级联删除词义/题目/选项（schema onDelete: Cascade）
}

export async function addMeaning(wordId: number, meaning: string) {
  await getWordDetail(wordId);
  return prisma.wordMeaning.create({ data: { wordId, meaning, sortOrder: 0 } });
}

export async function updateMeaning(id: number, meaning: string) {
  return prisma.wordMeaning.update({ where: { id }, data: { meaning } });
}

export async function deleteMeaning(id: number) {
  await prisma.wordMeaning.delete({ where: { id } });
}
```

- [ ] **Step 3: 控制器与路由**

`vocabulary.controller.ts` 提供薄封装（解析参数 → 调 service → 统一响应）；`vocabulary.routes.ts`：

```typescript
import { Router } from "express";
import * as ctrl from "./vocabulary.controller.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

export const vocabularyRouter = Router();
vocabularyRouter.get("/", requireAuth, ctrl.listHandler);
vocabularyRouter.get("/:id", requireAuth, ctrl.detailHandler);
vocabularyRouter.post("/", requireAuth, requireAdmin, ctrl.createHandler);
vocabularyRouter.put("/:id", requireAuth, requireAdmin, ctrl.updateHandler);
vocabularyRouter.delete("/:id", requireAuth, requireAdmin, ctrl.deleteHandler);
vocabularyRouter.post("/:id/meanings", requireAuth, requireAdmin, ctrl.addMeaningHandler);
vocabularyRouter.put("/meanings/:id", requireAuth, requireAdmin, ctrl.updateMeaningHandler);
vocabularyRouter.delete("/meanings/:id", requireAuth, requireAdmin, ctrl.deleteMeaningHandler);
```

`app.ts` 挂载 `app.use("/api/words", vocabularyRouter)`。

- [ ] **Step 4: 测试**

`server/tests/vocabulary.test.ts` 用例：

1. 管理员创建单词（带 2 条词义），响应 `code: 0`。
2. 普通用户调用创建接口返回 `40301`。
3. `GET /api/words?keyword=abandon` 能查到此词且 `meaningCount: 2`。
4. 删除单词后 `GET /api/words/:id` 返回 `40401`，词义表同步删除。

测试内需要先创建管理员与普通用户（直接操作 Prisma 或走注册接口后改 role），token 通过 `signToken` 生成。

运行 `npm test` 预期全部通过。提交：

```powershell
git add .
git commit -m "feat: vocabulary and meaning CRUD"
```

---

## P3：出题引擎与自适应测试

### Task 8: 五选一出题引擎

**Files:**
- Create: `server/src/modules/question/question.service.ts`
- Create: `server/tests/question.test.ts`

- [ ] **Step 1: 干扰项选择**

`server/src/modules/question/question.service.ts`：

```typescript
import { Level, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickDistractors(
  wordId: number,
  level: Level,
  correctMeaning: string,
  count = 4
): Promise<string[]> {
  const sameLevel = await prisma.wordMeaning.findMany({
    where: { wordId: { not: wordId }, word: { level } },
    select: { meaning: true },
    take: 200
  });
  const fallback = sameLevel.length < count
    ? await prisma.wordMeaning.findMany({
        where: { wordId: { not: wordId }, meaning: { not: correctMeaning } },
        select: { meaning: true },
        take: 200
      })
    : [];
  const pool = [...sameLevel, ...fallback].map((m) => m.meaning).filter((t) => t !== correctMeaning);
  const unique = [...new Set(pool)];
  if (unique.length < count) {
    throw Object.assign(new Error("干扰项不足，无法生成题目"), { code: 50001 });
  }
  return shuffle(unique).slice(0, count);
}
```

- [ ] **Step 2: 取题或生成题（题库缓存）**

同一文件追加：

```typescript
export async function getOrCreateQuestion(wordId: number, level: Level) {
  const cached = await prisma.question.findFirst({
    where: { wordId, disabled: false },
    include: { options: true }
  });
  if (cached) return cached;

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: { meanings: { orderBy: { sortOrder: "asc" }, take: 10 } }
  });
  if (!word || word.meanings.length === 0) {
    throw Object.assign(new Error("该单词暂无释义，无法出题"), { code: 40401 });
  }
  const correct = word.meanings[0];
  const distractors = await pickDistractors(wordId, level, correct.meaning);
  const options = shuffle([correct.meaning, ...distractors]);
  return prisma.question.create({
    data: {
      wordId,
      correctMeaningId: correct.id,
      level,
      options: {
        create: options.map((text, i) => ({
          text,
          meaningId: text === correct.meaning ? correct.id : null,
          isCorrect: text === correct.meaning,
          sortOrder: i
        }))
      }
    },
    include: { options: true }
  });
}
```

规则：正确项固定取 `sortOrder` 最小的释义；干扰项不来自目标单词的其他释义、文本不重复；`level` 以出题时当前等级为准。

- [ ] **Step 3: 题目序列化**

```typescript
export function toClientQuestion(question: any, seq: number, testedLevel: Level) {
  const options = [...question.options].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => o.text);
  return {
    seq,
    word: question.word?.headword ?? "",
    question: `${question.word?.headword ?? ""}是什么意思？`,
    options,
    testedLevel
  };
}
```

- [ ] **Step 4: 测试**

`server/tests/question.test.ts` 用例：

1. 对已 seed 的单词（如 `abandon`）调用 `getOrCreateQuestion`，断言：选项 5 个、包含正确释义、无重复文本、不包含该单词其他释义。
2. 再次调用返回同一 `question.id`（缓存生效）。
3. 对无释义的单词调用抛出 `40401`。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: five-choice question engine with distractor rules"
```

### Task 9: 自适应测试引擎（规则与快照）

**Files:**
- Create: `server/src/modules/test/adaptive.engine.ts`
- Create: `server/src/modules/test/test.service.ts`
- Create: `server/tests/adaptive.test.ts`

- [ ] **Step 1: 等级规则**

`server/src/modules/test/adaptive.engine.ts`：

```typescript
import { Level } from "@prisma/client";

export const LEVEL_SEQUENCE: Level[] = [Level.K1, Level.K2, Level.K3, Level.K5, Level.K10, Level.K10P];

export function applyLevelRules(current: Level, streakCorrect: number, streakWrong: number): Level {
  const idx = LEVEL_SEQUENCE.indexOf(current);
  if (streakCorrect >= 4 && idx >= 0 && idx < LEVEL_SEQUENCE.length - 1) {
    return LEVEL_SEQUENCE[idx + 1];
  }
  if (streakWrong >= 2 && idx > 0) {
    return LEVEL_SEQUENCE[idx - 1];
  }
  return current;
}

export function computeStreaks(items: { isCorrect: boolean }[]): { streakCorrect: number; streakWrong: number } {
  const last = items[items.length - 1];
  if (!last) return { streakCorrect: 0, streakWrong: 0 };
  const target = last.isCorrect ? "correct" : "wrong";
  let count = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const ok = items[i].isCorrect;
    if ((target === "correct" && ok) || (target === "wrong" && !ok)) count += 1;
    else break;
  }
  return target === "correct" ? { streakCorrect: count, streakWrong: 0 } : { streakCorrect: 0, streakWrong: count };
}
```

- [ ] **Step 2: 会话创建与出题**

`server/src/modules/test/test.service.ts`：

```typescript
import { Level, PrismaClient } from "@prisma/client";
import { getOrCreateQuestion, toClientQuestion } from "../question/question.service.js";
import { applyLevelRules, computeStreaks } from "./adaptive.engine.js";

const prisma = new PrismaClient();

export async function createSession(
  userId: number,
  type: "ADAPTIVE" | "VERIFICATION" | "WRONG_WORD",
  targetLevel?: Level
) {
  return prisma.testSession.create({
    data: {
      userId,
      type,
      targetLevel,
      totalQuestions: 30,
      correctCount: 0,
      wrongCount: 0
    }
  });
}

export async function issueQuestion(sessionId: number, seq: number, level: Level) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidates = await prisma.word.findMany({
      where: { level, status: "ENABLED" },
      select: { id: true },
      take: 500
    });
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (!pick) throw Object.assign(new Error("该等级暂无可用单词"), { code: 50001 });
    try {
      const question = await getOrCreateQuestion(pick.id, level);
      const item = await prisma.testSessionItem.create({
        data: {
          sessionId,
          seq,
          wordId: pick.id,
          testedLevel: level,
          optionsSnapshot: JSON.stringify(question.options.map((o: any) => o.text)),
          correctOptionIndex: question.options.findIndex((o: any) => o.isCorrect),
          isCorrect: false
        }
      });
      return { item, question };
    } catch {
      // 该单词无释义无法出题，换一个候选词重试
    }
  }
  throw Object.assign(new Error("该等级暂无可出题单词"), { code: 50001 });
}
```

> 说明：候选词从 `ENABLED` 单词随机取，`getOrCreateQuestion` 会跳过无释义单词，最多重试 5 次，避免整场测试失败。

- [ ] **Step 3: 答题与结算**

同一文件追加：

```typescript
export async function answerQuestion(
  sessionId: number,
  userId: number,
  optionIndex: number,
  answerTimeMs: number
) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  if (!session || session.userId !== userId) {
    throw Object.assign(new Error("测试不存在"), { code: 40401 });
  }
  if (session.finishedAt) throw Object.assign(new Error("测试已完成"), { code: 40901 });

  const item = session.items.find((it) => it.userOptionIndex === null);
  if (!item) throw Object.assign(new Error("没有待作答的题目"), { code: 40901 });

  const isCorrect = optionIndex === item.correctOptionIndex;
  await prisma.testSessionItem.update({
    where: { id: item.id },
    data: { userOptionIndex: optionIndex, isCorrect, answerTimeMs }
  });

  const answered = session.items.filter((it) => it.userOptionIndex !== null).length + 1;
  const correctCount = session.correctCount + (isCorrect ? 1 : 0);
  const wrongCount = answered - correctCount;

  if (answered >= session.totalQuestions) {
    return finishSession(session.id, correctCount, wrongCount);
  }

  const streaks = computeStreaks([
    ...session.items.map((it) => ({ isCorrect: it.isCorrect })),
    { isCorrect }
  ]);
  const nextLevel =
    session.type === "ADAPTIVE"
      ? applyLevelRules(item.testedLevel, streaks.streakCorrect, streaks.streakWrong)
      : session.type === "VERIFICATION"
        ? session.targetLevel!
        : item.testedLevel;

  await prisma.testSession.update({
    where: { id: session.id },
    data: { correctCount, wrongCount }
  });

  const next = await issueQuestion(session.id, answered + 1, nextLevel);
  const word = await prisma.word.findUniqueOrThrow({ where: { id: next.item.wordId } });
  return {
    isCorrect,
    correctIndex: item.correctOptionIndex,
    currentLevel: nextLevel,
    finished: false,
    nextQuestion: toClientQuestion({ ...next.question, word }, answered + 1, nextLevel)
  };
}

async function finishSession(sessionId: number, correctCount: number, wrongCount: number) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  const accuracy = correctCount / session.totalQuestions;
  const finalLevel =
    session.type === "VERIFICATION" ? session.targetLevel! : session.items[session.items.length - 1].testedLevel;
  const estimatedVocabulary = estimateVocabulary(finalLevel, session.items);
  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      correctCount,
      wrongCount,
      finalLevel,
      estimatedVocabulary,
      accuracy,
      finishedAt: new Date()
    }
  });
  await recordWrongWords(sessionId); // Task 13 提供
  const last = session.items[session.items.length - 1];
  return {
    isCorrect: last.isCorrect,
    correctIndex: last.correctOptionIndex,
    currentLevel: finalLevel,
    finished: true,
    reportId: sessionId
  };
}
```

> 说明：`estimateVocabulary` 与 `recordWrongWords` 分别在 Task 11 与 Task 13 实现，本任务先放最小占位（`estimateVocabulary` 返回 `LEVEL_RANK[finalLevel] * 1000`，`recordWrongWords` 为空函数），后续替换。

- [ ] **Step 4: 规则单元测试**

`server/tests/adaptive.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import { Level } from "@prisma/client";
import { applyLevelRules, computeStreaks } from "../src/modules/test/adaptive.engine.js";

describe("applyLevelRules", () => {
  it("4 correct in a row raises level", () => {
    expect(applyLevelRules(Level.K3, 4, 0)).toBe(Level.K5);
  });
  it("2 wrong in a row lowers level", () => {
    expect(applyLevelRules(Level.K5, 0, 2)).toBe(Level.K3);
  });
  it("K1 never goes below", () => {
    expect(applyLevelRules(Level.K1, 0, 2)).toBe(Level.K1);
  });
  it("K10P never goes above", () => {
    expect(applyLevelRules(Level.K10P, 4, 0)).toBe(Level.K10P);
  });
});

describe("computeStreaks", () => {
  it("counts trailing correct answers", () => {
    expect(computeStreaks([{ isCorrect: false }, { isCorrect: true }, { isCorrect: true }])).toEqual({
      streakCorrect: 2,
      streakWrong: 0
    });
  });
});
```

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: adaptive test engine with level rules and snapshots"
```

### Task 10: 测试接口与额度校验

**Files:**
- Create: `server/src/modules/plan/plan.service.ts`
- Create: `server/src/modules/test/test.controller.ts`
- Create: `server/src/modules/test/test.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/test.api.test.ts`

- [ ] **Step 1: 套餐额度服务**

`server/src/modules/plan/plan.service.ts`：

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getQuota(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { package: true }
  });
  if (!user) throw Object.assign(new Error("用户不存在"), { code: 40401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const finishedToday = await prisma.testSession.count({
    where: { userId, finishedAt: { not: null }, startedAt: { gte: today } }
  });
  const limit = user.package.dailyTestLimit;
  return {
    packageCode: user.package.code,
    remainingDailyTests: limit == null ? null : Math.max(0, limit - finishedToday),
    verificationEnabled: user.package.verificationEnabled,
    wrongBookEnabled: user.package.wrongBookEnabled,
    historyEnabled: user.package.historyEnabled
  };
}

export async function assertCanStartAdaptive(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const quota = await getQuota(userId);
  if (quota.packageCode === "FREE" && (quota.remainingDailyTests ?? 0) <= 0) {
    throw Object.assign(new Error("今日免费测试次数已用完"), { code: 40302 });
  }
  if (quota.packageCode === "SINGLE" && user.remainingTestCount <= 0) {
    throw Object.assign(new Error("单次测试次数已用完"), { code: 40302 });
  }
  if (user.packageExpireTime && user.packageExpireTime.getTime() < Date.now()) {
    throw Object.assign(new Error("套餐已过期"), { code: 40302 });
  }
  if (quota.packageCode === "SINGLE") {
    await prisma.user.update({ where: { id: userId }, data: { remainingTestCount: { decrement: 1 } } });
  }
}

export async function assertFeature(userId: number, feature: "verification" | "wrongBook") {
  const quota = await getQuota(userId);
  const ok = feature === "verification" ? quota.verificationEnabled : quota.wrongBookEnabled;
  if (!ok) throw Object.assign(new Error("当前套餐未开通该功能"), { code: 40302 });
}
```

- [ ] **Step 2: 测试控制器**

`test.controller.ts` 实现：

- `quotaHandler`：返回 `getQuota`。
- `startAdaptiveHandler`：`assertCanStartAdaptive(userId)` → `createSession(userId, "ADAPTIVE")` → `issueQuestion(session.id, 1, Level.K3)` → 返回 `{ sessionId, totalQuestions: 30, currentLevel: "K3", question: toClientQuestion(...) }`。
- `startVerificationHandler`：`assertFeature(userId, "verification")` + body `{ level }` → `createSession(userId, "VERIFICATION", level)` → `issueQuestion(session.id, 1, level)`。
- `startWrongWordHandler`：`assertFeature(userId, "wrongBook")` → 走 Task 13 的错词再测服务。
- `answerHandler`：`answerQuestion(sessionId, userId, optionIndex, answerTimeMs)`。
- `listHandler` / `detailHandler` / `abandonHandler`：历史列表按类型筛选分页，且按套餐限制：`historyEnabled=false`（FREE/SINGLE）只返回最近一次完成测试，月卡/年卡返回全部；明细返回会话与逐题信息（本人或管理员）；abandon 不生成报告，SINGLE 套餐在 start 扣减次数后于 abandon 时返还。

`test.routes.ts`：

```typescript
import { Router } from "express";
import * as ctrl from "./test.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const testRouter = Router();
testRouter.get("/quota", requireAuth, ctrl.quotaHandler);
testRouter.get("/", requireAuth, ctrl.listHandler);
testRouter.get("/:sessionId", requireAuth, ctrl.detailHandler);
testRouter.post("/adaptive/start", requireAuth, ctrl.startAdaptiveHandler);
testRouter.post("/verification/start", requireAuth, ctrl.startVerificationHandler);
testRouter.post("/wrong-word/start", requireAuth, ctrl.startWrongWordHandler);
testRouter.post("/:sessionId/answer", requireAuth, ctrl.answerHandler);
testRouter.post("/:sessionId/abandon", requireAuth, ctrl.abandonHandler);
```

`app.ts` 挂载 `app.use("/api/tests", testRouter)`。

- [ ] **Step 3: 集成测试**

`server/tests/test.api.test.ts`：

1. 免费用户 `POST /api/tests/adaptive/start` 成功，返回 `sessionId`、`totalQuestions: 30`、首题 `testedLevel: "K3"`。
2. 连续答对 4 题后，第 5 题 `testedLevel` 变为 `K5`。
3. 答满 30 题，最后一次响应 `finished: true` 且返回 `reportId`。
4. 同日再次 start 免费测试返回 `40302`。
5. 未登录调用返回 `40101`。

> 测试中直接取每题的 `correctOptionIndex`（item 快照）构造正确选项索引，模拟"全对"路径。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: test endpoints with plan quota checks"
```

---

## P4：评估与报告

### Task 11: 词汇量评估与报告接口

**Files:**
- Create: `server/src/modules/report/report.service.ts`
- Create: `server/src/modules/report/report.controller.ts`
- Create: `server/src/modules/report/report.routes.ts`
- Modify: `server/src/modules/test/test.service.ts`（接入正式 `estimateVocabulary`）
- Modify: `server/src/app.ts`
- Create: `server/tests/report.test.ts`

- [ ] **Step 1: 评估服务**

`server/src/modules/report/report.service.ts`：

```typescript
import { Level, PrismaClient } from "@prisma/client";
import { LEVEL_RANK } from "../../utils/level.js";

const prisma = new PrismaClient();

const CEFR: Record<Level, string> = {
  [Level.K1]: "A1",
  [Level.K2]: "A2",
  [Level.K3]: "B1",
  [Level.K5]: "B2",
  [Level.K10]: "C1",
  [Level.K10P]: "C2"
};

export function estimateVocabulary(finalLevel: Level, items: { testedLevel: Level; isCorrect: boolean }[]) {
  if (finalLevel !== Level.K10P) {
    return LEVEL_RANK[finalLevel] * 1000;
  }
  const k10pItems = items.filter((it) => it.testedLevel === Level.K10P);
  if (k10pItems.length === 0) return 10000;
  const rate = k10pItems.filter((it) => it.isCorrect).length / k10pItems.length;
  return 10000 + Math.round(rate * 15000);
}

export function cefrOf(level: Level): string {
  return CEFR[level];
}
```

`test.service.ts` 中 `finishSession` 改用此正式 `estimateVocabulary`（替换 Task 9 的最小实现）。

- [ ] **Step 2: 报告组装**

同一文件追加：

```typescript
export async function buildReport(sessionId: number, requesterId: number, requesterRole: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      items: { include: { word: true }, orderBy: { seq: "asc" } },
      user: true
    }
  });
  if (!session || (session.userId !== requesterId && requesterRole !== "ADMIN")) {
    throw Object.assign(new Error("报告不存在"), { code: 40401 });
  }

  const byLevel = new Map<Level, { answered: number; correct: number }>();
  for (const item of session.items) {
    const entry = byLevel.get(item.testedLevel) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (item.isCorrect) entry.correct += 1;
    byLevel.set(item.testedLevel, entry);
  }
  const levelMastery = [...byLevel.entries()].map(([level, v]) => ({
    level,
    answered: v.answered,
    correct: v.correct,
    rate: Number((v.correct / v.answered).toFixed(2))
  }));

  const wrongWords = session.items
    .filter((it) => !it.isCorrect)
    .map((it) => ({
      wordId: it.word.id,
      headword: it.word.headword,
      correctMeaning: JSON.parse(it.optionsSnapshot)[it.correctOptionIndex]
    }));

  return {
    sessionId: session.id,
    testTime: session.startedAt,
    type: session.type,
    totalQuestions: session.totalQuestions,
    correctCount: session.correctCount,
    accuracy: session.accuracy,
    finalLevel: session.finalLevel,
    estimatedVocabulary: session.estimatedVocabulary,
    cefr: session.finalLevel ? cefrOf(session.finalLevel) : null,
    passed: session.type === "VERIFICATION" ? (session.accuracy ?? 0) >= 0.8 : null,
    levelMastery,
    wrongWords
  };
}
```

- [ ] **Step 3: 路由与挂载**

`report.routes.ts`：

```typescript
import { Router } from "express";
import * as ctrl from "./report.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const reportRouter = Router();
reportRouter.get("/", requireAuth, ctrl.listHandler);
reportRouter.get("/:sessionId", requireAuth, ctrl.detailHandler);
```

`app.ts` 挂载 `app.use("/api/reports", reportRouter)`。

- [ ] **Step 4: 测试**

`server/tests/report.test.ts` 用例：

1. 手工构造一个已完成会话（3 题：K1 对、K1 对、K3 错），断言 `buildReport` 的 `levelMastery` 为 `[{K1, answered:2, correct:2, rate:1}, {K3, answered:1, correct:0, rate:0}]`。
2. `estimateVocabulary(K5, [])` 返回 5000。
3. `estimateVocabulary(K10P, [{testedLevel: K10P, isCorrect: true}, {testedLevel: K10P, isCorrect: false}])` 返回 17500。
4. 非本人访问报告返回 `40401`。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: report service with mastery, vocabulary estimate and cefr"
```

---

## P5：等级验证与错词本

### Task 12: 等级验证测试

**Files:**
- Modify: `server/src/modules/test/test.service.ts`（复用，无需大改）
- Modify: `server/src/modules/report/report.service.ts`（已含 passed 字段）
- Create: `server/tests/verification.test.ts`

- [ ] **Step 1: 验证逻辑确认**

`answerQuestion` 对 `VERIFICATION` 类型固定 `testedLevel = targetLevel` 出题、不升降级（Task 9 已实现）。`buildReport` 已输出 `passed = accuracy >= 0.8`。本任务只需确认 `startVerificationHandler` 权限校验（Task 10 已实现 `assertFeature`）。

- [ ] **Step 2: 测试**

`server/tests/verification.test.ts` 用例：

1. 月卡用户 start 验证 `K3`，30 题全部答对 → 报告 `passed: true`、`finalLevel: "K3"`。
2. 只答对 23 题（正确率 < 0.8）→ `passed: false`。
3. 免费用户 start 验证返回 `40302`。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: level verification test with 80% pass rule"
```

### Task 13: 错词本

**Files:**
- Create: `server/src/modules/wrong-word/wrong-word.service.ts`
- Create: `server/src/modules/wrong-word/wrong-word.controller.ts`
- Create: `server/src/modules/wrong-word/wrong-word.routes.ts`
- Modify: `server/src/modules/test/test.service.ts`（实现 `recordWrongWords`）
- Modify: `server/src/modules/test/test.controller.ts`（`startWrongWordHandler`）
- Modify: `server/src/app.ts`
- Create: `server/tests/wrong-word.test.ts`

- [ ] **Step 1: 错词记录**

`server/src/modules/wrong-word/wrong-word.service.ts`：

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function recordWrongWords(sessionId: number) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { items: { orderBy: { seq: "asc" } } }
  });
  for (const item of session.items) {
    if (item.isCorrect) continue;
    const snapshot: string[] = JSON.parse(item.optionsSnapshot);
    const correctText = snapshot[item.correctOptionIndex];
    const existing = await prisma.wrongWord.findUnique({
      where: { userId_wordId: { userId: session.userId, wordId: item.wordId } }
    });
    if (existing) {
      await prisma.wrongWord.update({
        where: { id: existing.id },
        data: { errorCount: { increment: 1 }, lastErrorAt: new Date(), correctMeaningText: correctText }
      });
    } else {
      await prisma.wrongWord.create({
        data: { userId: session.userId, wordId: item.wordId, correctMeaningText: correctText }
      });
    }
  }
}
```

`test.service.ts` 的 `finishSession` 改为调用此函数（替换 Task 9 的空占位）。

- [ ] **Step 2: 列表 / 移除 / 复习 / 再测**

同一文件追加：

```typescript
export async function listWrongWords(userId: number, page: number, pageSize: number) {
  const where = { userId };
  const [total, list] = await Promise.all([
    prisma.wrongWord.count({ where }),
    prisma.wrongWord.findMany({
      where,
      include: { word: true },
      orderBy: [{ errorCount: "desc" }, { lastErrorAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  return {
    list: list.map((w) => ({
      id: w.id,
      headword: w.word.headword,
      level: w.word.level,
      correctMeaning: w.correctMeaningText,
      errorCount: w.errorCount,
      lastErrorTime: w.lastErrorAt
    })),
    total,
    page,
    pageSize
  };
}

export async function removeWrongWord(userId: number, id: number) {
  await prisma.wrongWord.deleteMany({ where: { id, userId } });
}

export async function reviewWrongWord(userId: number, id: number) {
  await removeWrongWord(userId, id); // 复习确认掌握后移除
}
```

- [ ] **Step 3: 错词再测**

`wrong-word.service.ts` 中新增（引用 `test.service.ts` 的 `createSession` 与 `getOrCreateQuestion`）：

```typescript
export async function createWrongWordSession(userId: number) {
  const wrongs = await prisma.wrongWord.findMany({
    where: { userId },
    include: { word: true },
    orderBy: [{ errorCount: "desc" }],
    take: 10
  });
  if (wrongs.length === 0) throw Object.assign(new Error("错词本为空"), { code: 40401 });
  const session = await createSession(userId, "WRONG_WORD");
  for (let i = 0; i < wrongs.length; i++) {
    const question = await getOrCreateQuestion(wrongs[i].wordId, wrongs[i].word.level);
    await prisma.testSessionItem.create({
      data: {
        sessionId: session.id,
        seq: i + 1,
        wordId: wrongs[i].wordId,
        testedLevel: wrongs[i].word.level,
        optionsSnapshot: JSON.stringify(question.options.map((o: any) => o.text)),
        correctOptionIndex: question.options.findIndex((o: any) => o.isCorrect),
        isCorrect: false
      }
    });
  }
  return session;
}
```

`test.controller.ts` 的 `startWrongWordHandler` 调用它并返回首题（`session.totalQuestions` 为实际错词数）。

- [ ] **Step 4: 路由与挂载**

`wrong-word.routes.ts`：

```typescript
import { Router } from "express";
import * as ctrl from "./wrong-word.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const wrongWordRouter = Router();
wrongWordRouter.get("/", requireAuth, ctrl.listHandler);
wrongWordRouter.delete("/:id", requireAuth, ctrl.removeHandler);
wrongWordRouter.post("/:id/review", requireAuth, ctrl.reviewHandler);
```

`app.ts` 挂载 `app.use("/api/wrong-words", wrongWordRouter)`。

- [ ] **Step 5: 测试**

`server/tests/wrong-word.test.ts` 用例：

1. 完成一场有错误答案的测试后，错词本列表出现对应单词且 `errorCount: 1`。
2. 同词再次答错，`errorCount` 累加为 2。
3. 复习接口后列表移除该词。
4. 错词再测返回的题目单词来自错词本。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: wrong word book with retest"
```

---

## P6：用户主页与管理后台后端

### Task 14: 用户主页与个人资料

**Files:**
- Create: `server/src/modules/user/user.service.ts`
- Create: `server/src/modules/user/user.controller.ts`
- Create: `server/src/modules/user/user.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/user.test.ts`

- [ ] **Step 1: 主页聚合服务**

`server/src/modules/user/user.service.ts`：

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getHome(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { package: true }
  });
  const latest = await prisma.testSession.findFirst({
    where: { userId, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" }
  });
  const [testCount, wrongWordCount] = await Promise.all([
    prisma.testSession.count({ where: { userId, finishedAt: { not: null } } }),
    prisma.wrongWord.count({ where: { userId } })
  ]);
  const recentTests = await prisma.testSession.findMany({
    where: { userId, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: 5
  });
  return {
    currentLevel: latest?.finalLevel ?? null,
    estimatedVocabulary: latest?.estimatedVocabulary ?? null,
    testCount,
    wrongWordCount,
    package: { code: user.package.code, name: user.package.name },
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
  return prisma.user.update({ where: { id: userId }, data: { avatar: avatar ?? null } });
}
```

- [ ] **Step 2: 路由与挂载**

`user.routes.ts`：

```typescript
export const userRouter = Router();
userRouter.get("/home", requireAuth, ctrl.homeHandler);
userRouter.put("/profile", requireAuth, ctrl.profileHandler);
```

`app.ts` 挂载 `app.use("/api/user", userRouter)`；`/api/plans` 与 `/api/user/plan` 由 `plan` 模块提供（`getQuota` 扩展返回套餐名称与到期时间）。

- [ ] **Step 3: 测试**

`server/tests/user.test.ts`：注册用户 → 完成一场测试 → `GET /api/user/home` 断言 `testCount: 1`、`currentLevel` 非空；`PUT /api/user/profile` 修改头像后 `GET /api/auth/me` 头像更新。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: user home aggregate and profile update"
```

### Task 15: 管理后台接口

**Files:**
- Create: `server/src/modules/admin/admin.service.ts`
- Create: `server/src/modules/admin/admin.controller.ts`
- Create: `server/src/modules/admin/admin.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/admin.test.ts`

- [ ] **Step 1: 用户管理与统计**

`server/src/modules/admin/admin.service.ts`：

```typescript
import { Level, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listUsers(params: { keyword?: string; packageCode?: string; page: number; pageSize: number }) {
  const where: any = {};
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

export async function setPackage(
  userId: number,
  data: { packageId: number; expireTime?: string | null; remainingTestCount?: number }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      packageId: data.packageId,
      packageExpireTime: data.expireTime ? new Date(data.expireTime) : null,
      remainingTestCount: data.remainingTestCount ?? 0
    }
  });
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
```

- [ ] **Step 2: 题库管理服务**

同一文件追加：

```typescript
export async function listQuestions(params: { keyword?: string; level?: Level; page: number; pageSize: number }) {
  const where: any = { disabled: false };
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

export async function updateQuestion(id: number, data: { disabled?: boolean; options?: { text: string; isCorrect: boolean }[] }) {
  if (data.options) {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.questionOption.createMany({
      data: data.options.map((o, i) => ({ questionId: id, text: o.text, isCorrect: o.isCorrect, sortOrder: i }))
    });
  }
  return prisma.question.update({ where: { id }, data: { disabled: data.disabled } });
}
```

人工录题 `createQuestion`：接收 `{ wordId, correctMeaningId, options }`，校验 `correctMeaningId` 属于该单词后创建；删除题目直接 `prisma.question.delete`（级联选项）。

- [ ] **Step 3: 路由与测试**

`admin.routes.ts` 全部挂 `requireAuth, requireAdmin`：

```typescript
export const adminRouter = Router();
adminRouter.get("/users", requireAuth, requireAdmin, ctrl.listUsersHandler);
adminRouter.get("/users/:id", requireAuth, requireAdmin, ctrl.userDetailHandler);
adminRouter.put("/users/:id/package", requireAuth, requireAdmin, ctrl.setPackageHandler);
adminRouter.get("/questions", requireAuth, requireAdmin, ctrl.listQuestionsHandler);
adminRouter.post("/questions", requireAuth, requireAdmin, ctrl.createQuestionHandler);
adminRouter.put("/questions/:id", requireAuth, requireAdmin, ctrl.updateQuestionHandler);
adminRouter.delete("/questions/:id", requireAuth, requireAdmin, ctrl.deleteQuestionHandler);
adminRouter.get("/stats/overview", requireAuth, requireAdmin, ctrl.statsHandler);
```

`server/tests/admin.test.ts`：管理员可查用户列表与统计；普通用户访问返回 `40301`；`setPackage` 后用户套餐码变化；题库更新选项后列表反映。

运行 `npm test` 预期通过。提交：

```powershell
git add .
git commit -m "feat: admin users, questions and stats APIs"
```

---

## P7：前端页面

### Task 16: 认证页面与守卫

**Files:**
- Create: `client/src/stores/auth.ts`
- Create: `client/src/api/auth.ts`
- Create: `client/src/views/auth/Login.vue`
- Create: `client/src/views/auth/Register.vue`
- Create: `client/src/views/auth/ForgotPassword.vue`
- Modify: `client/src/router/index.ts`

- [ ] **Step 1: auth store 与 API**

`client/src/api/auth.ts`：

```typescript
import { http } from "./http";

export const authApi = {
  register: (data: { username: string; password: string; email?: string }) => http.post("/auth/register", data),
  login: (data: { username: string; password: string }) => http.post("/auth/login", data),
  sendEmailCode: (email: string) => http.post("/auth/email-code", { email }),
  loginByEmail: (data: { email: string; code: string }) => http.post("/auth/login-by-email", data),
  bindEmailCode: (email: string) => http.post("/auth/bind-email-code", { email }),
  bindEmail: (data: { email: string; code: string }) => http.post("/auth/bind-email", data),
  resetPassword: (data: { email: string; code: string; newPassword: string }) => http.post("/auth/reset-password", data),
  me: () => http.get("/auth/me")
};
```

`client/src/stores/auth.ts`：

```typescript
import { defineStore } from "pinia";
import { authApi } from "../api/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") ?? "",
    user: null as null | { id: number; username: string; email?: string; role?: string }
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === "ADMIN"
  },
  actions: {
    setSession(data: { token: string; user: any }) {
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem("token", data.token);
    },
    async login(username: string, password: string) {
      const data = await authApi.login({ username, password });
      this.setSession(data as any);
    },
    async fetchMe() {
      this.user = (await authApi.me()) as any;
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("token");
    }
  }
});
```

`Login.vue` 两个 Tab：用户名密码表单；邮箱登录（输入邮箱 → 发送验证码，按钮 60 秒倒计时 → 输入验证码 → 登录）。`Register.vue` 与 `ForgotPassword.vue` 按 `docs/05-frontend.md` 布局实现。

- [ ] **Step 2: 路由守卫升级**

`router/index.ts` 使用 meta 标记：

```typescript
const routes = [
  { path: "/login", component: () => import("../views/auth/Login.vue"), meta: { public: true } },
  { path: "/register", component: () => import("../views/auth/Register.vue"), meta: { public: true } },
  { path: "/forgot", component: () => import("../views/auth/ForgotPassword.vue"), meta: { public: true } },
  { path: "/", component: () => import("../views/test/TestCenter.vue"), meta: { auth: true } },
  { path: "/user", component: () => import("../views/user/UserHome.vue"), meta: { auth: true } },
  { path: "/admin/users", component: () => import("../views/admin/AdminUsers.vue"), meta: { auth: true, admin: true } }
];

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isLoggedIn) return "/login";
  if (to.meta.admin && !auth.isAdmin) return "/";
  return true;
});
```

`main.ts` 注册 Pinia 后调用 `auth.fetchMe()`（token 有效则拉取用户，401 时由拦截器清 token）。

- [ ] **Step 3: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
```

预期构建通过。提交：

```powershell
git add .
git commit -m "feat: auth pages, store and route guards"
```

### Task 17: 测试中心与答题流程

**Files:**
- Create: `client/src/api/test.ts`
- Create: `client/src/stores/test.ts`
- Create: `client/src/views/test/TestCenter.vue`
- Create: `client/src/views/test/AdaptiveTest.vue`
- Create: `client/src/views/test/VerificationTest.vue`
- Create: `client/src/views/test/WrongWordTest.vue`
- Create: `client/src/components/QuestionCard.vue`
- Create: `client/src/components/TestProgress.vue`

- [ ] **Step 1: API 与测试 store**

`client/src/api/test.ts`：

```typescript
import { http } from "./http";

export const testApi = {
  quota: () => http.get("/tests/quota"),
  startAdaptive: () => http.post("/tests/adaptive/start"),
  startVerification: (level: string) => http.post("/tests/verification/start", { level }),
  startWrongWord: () => http.post("/tests/wrong-word/start"),
  answer: (sessionId: number, optionIndex: number, answerTimeMs: number) =>
    http.post(`/tests/${sessionId}/answer`, { optionIndex, answerTimeMs }),
  history: (params?: { type?: string; page?: number }) => http.get("/tests", { params }),
  detail: (sessionId: number) => http.get(`/tests/${sessionId}`)
};
```

`client/src/stores/test.ts` 管理会话状态：

```typescript
export const useTestStore = defineStore("test", {
  state: () => ({
    sessionId: null as number | null,
    totalQuestions: 30,
    currentLevel: "",
    seq: 0,
    question: null as any,
    startedAt: 0,
    finished: false
  }),
  actions: {
    async start(kind: "adaptive" | "verification" | "wrong", level?: string) {
      const res: any =
        kind === "adaptive"
          ? await testApi.startAdaptive()
          : kind === "verification"
            ? await testApi.startVerification(level!)
            : await testApi.startWrongWord();
      this.sessionId = res.sessionId;
      this.totalQuestions = res.totalQuestions;
      this.currentLevel = res.currentLevel;
      this.question = res.question;
      this.seq = res.question.seq;
      this.startedAt = Date.now();
      this.finished = false;
    },
    async answer(optionIndex: number) {
      const res: any = await testApi.answer(this.sessionId!, optionIndex, Date.now() - this.startedAt);
      this.startedAt = Date.now();
      if (res.finished) {
        this.finished = true;
        return { finished: true, reportId: res.reportId };
      }
      this.currentLevel = res.currentLevel;
      this.question = res.nextQuestion;
      this.seq = res.nextQuestion.seq;
      return { finished: false, isCorrect: res.isCorrect, correctIndex: res.correctIndex };
    }
  }
});
```

- [ ] **Step 2: 答题页交互**

`AdaptiveTest.vue`（验证/错词再测复用相同结构）：

```vue
<template>
  <div>
    <TestProgress :seq="test.seq" :total="test.totalQuestions" />
    <QuestionCard
      v-if="test.question"
      :question="test.question"
      :locked="locked"
      @select="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";

const test = useTestStore();
const router = useRouter();
const locked = ref(false);

onMounted(() => {
  if (!test.sessionId) router.replace("/");
});

async function onSelect(optionIndex: number) {
  if (locked.value) return;
  locked.value = true;
  const res = await test.answer(optionIndex);
  if (res.finished) {
    router.push(`/test/result/${(res as any).reportId}`);
    return;
  }
  setTimeout(() => (locked.value = false), 3000);
}
</script>
```

`QuestionCard.vue`：渲染 `question.word`、`question.question`、5 个选项按钮；`@select` 触发后高亮所选，展示对错与正确答案（由父组件传入上一步 `isCorrect/correctIndex`）。

- [ ] **Step 3: 测试中心**

`TestCenter.vue` 挂载后调用 `testApi.quota()`，按返回渲染：今日剩余次数、三个入口卡片；`verificationEnabled/wrongBookEnabled` 为 false 时入口禁用并显示"开通月卡/年卡"。验证测试先弹等级选择（6 个 LevelBadge）再 `test.start("verification", level)`。

- [ ] **Step 4: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
```

预期通过。提交：

```powershell
git add .
git commit -m "feat: test center and question flow pages"
```

### Task 18: 结果页与报告页

**Files:**
- Create: `client/src/api/report.ts`
- Create: `client/src/views/test/TestResult.vue`
- Create: `client/src/views/report/ReportDetail.vue`
- Create: `client/src/components/RateBar.vue`

- [ ] **Step 1: API**

`client/src/api/report.ts`：

```typescript
import { http } from "./http";

export const reportApi = {
  detail: (sessionId: number) => http.get(`/reports/${sessionId}`),
  list: () => http.get("/reports")
};
```

- [ ] **Step 2: 页面**

`TestResult.vue`：路由参数 `sessionId`，展示 `reportApi.detail` 返回的 `finalLevel`、`estimatedVocabulary`、`accuracy`；按钮跳 `/report/:sessionId`。

`ReportDetail.vue`：展示测试时间、类型、题数、正确率、当前等级、预计词汇量、CEFR；`levelMastery` 用 `RateBar` 逐项渲染；`wrongWords` 渲染错词列表。类型文案映射：ADAPTIVE→自适应测试、VERIFICATION→等级验证、WRONG_WORD→错词再测。

`RateBar.vue`：props `{ level, rate }`，按 rate 渲染进度条宽度与百分比。

- [ ] **Step 3: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
git add .
git commit -m "feat: result and report pages"
```

### Task 19: 错词本、用户主页与设置

**Files:**
- Create: `client/src/api/wrongWords.ts`
- Create: `client/src/api/user.ts`
- Create: `client/src/views/wrong/WrongWords.vue`
- Create: `client/src/views/user/UserHome.vue`
- Create: `client/src/views/user/UserSettings.vue`

- [ ] **Step 1: API**

```typescript
// client/src/api/wrongWords.ts
export const wrongWordsApi = {
  list: (page = 1) => http.get("/wrong-words", { params: { page } }),
  remove: (id: number) => http.delete(`/wrong-words/${id}`),
  review: (id: number) => http.post(`/wrong-words/${id}/review`)
};

// client/src/api/user.ts
export const userApi = {
  home: () => http.get("/user/home"),
  updateProfile: (data: { avatar?: string }) => http.put("/user/profile", data),
  myPlan: () => http.get("/user/plan")
};
```

- [ ] **Step 2: 页面**

`WrongWords.vue`：列表渲染单词、LevelBadge、错误次数、正确释义；操作按钮"复习"（调 review 后刷新）与"移除"；顶部按钮"错词再测"跳 `/test/wrong`。

`UserHome.vue`：`userApi.home()` 渲染统计卡片（当前词汇量、当前等级、测试次数、错词数量）+ 套餐徽章 + 最近测试列表（点击进报告）。

`UserSettings.vue`：头像 URL 输入保存；绑定邮箱（`bindEmailCode` → 60 秒倒计时 → `bindEmail`）；"修改密码"入口跳 /forgot 完成重置。

- [ ] **Step 3: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
git add .
git commit -m "feat: wrong words, user home and settings pages"
```

### Task 20: 管理后台页面

**Files:**
- Create: `client/src/api/admin.ts`
- Create: `client/src/layouts/AdminLayout.vue`
- Create: `client/src/views/admin/AdminUsers.vue`
- Create: `client/src/views/admin/AdminWords.vue`
- Create: `client/src/views/admin/AdminQuestions.vue`
- Create: `client/src/views/admin/AdminStats.vue`

- [ ] **Step 1: API**

```typescript
// client/src/api/admin.ts
export const adminApi = {
  users: (params: any) => http.get("/admin/users", { params }),
  userDetail: (id: number) => http.get(`/admin/users/${id}`),
  setPackage: (id: number, data: any) => http.put(`/admin/users/${id}/package`, data),
  questions: (params: any) => http.get("/admin/questions", { params }),
  createQuestion: (data: any) => http.post("/admin/questions", data),
  updateQuestion: (id: number, data: any) => http.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => http.delete(`/admin/questions/${id}`),
  stats: () => http.get("/admin/stats/overview")
};
```

- [ ] **Step 2: 布局与页面**

`AdminLayout.vue`：左侧菜单（`router-link` 到四个后台路由）+ `<router-view>`；所有后台路由嵌套在其下。

- `AdminUsers.vue`：搜索框（用户名/邮箱）+ 套餐筛选 + 表格（用户、邮箱、套餐、测试次数、当前等级、状态）+ 套餐调整弹窗（选套餐、到期时间、单次剩余次数）。
- `AdminWords.vue`：搜索（关键词/等级/是否无释义）+ 单词表格 + 编辑弹窗（等级、词族、状态、词义列表增删改）。
- `AdminQuestions.vue`：搜索 + 题目表格（单词、等级、选项列表、正确答案标绿）+ 编辑弹窗（改选项文本/勾选正确答案/禁用）+ 人工录题弹窗。
- `AdminStats.vue`：四个 StatCard（用户数、测试次数、平均词汇量）+ 等级分布用 RateBar 渲染。

- [ ] **Step 3: 构建验证并提交**

```powershell
Set-Location client
npm run build
Set-Location ..
git add .
git commit -m "feat: admin pages"
```

---

## P8：联调与收尾

### Task 21: 权限矩阵联调、文档与最终验收

**Files:**
- Modify: `README.md`（根目录，写启动方式与默认账号）
- Modify: `docs/README.md`（状态改为"已开始实现"）

- [ ] **Step 1: 全量测试**

```powershell
Set-Location server
npm test
Set-Location ..
```

预期：全部测试文件通过，无 skip。

- [ ] **Step 2: 全新环境演练**

```powershell
Remove-Item server\prisma\dev.db -ErrorAction SilentlyContinue
Set-Location server
npx prisma migrate reset --force   # 重建库并执行 seed
npm run seed
npm run dev
Set-Location ..
```

手动验收清单：

1. 注册 → 用户名密码登录 → 邮箱绑定 → 邮箱验证码登录 → 找回密码，均可用。
2. 免费用户每日第 1 次自适应测试成功，第 2 次返回"今日次数已用完"。
3. 连续答对 4 题等级从 K3 升到 K5；连续答错 2 题从 K5 降回 K3；报告掌握率、词汇量、CEFR 正确。
4. 月卡用户可进入等级验证与错词本；免费用户入口禁用且接口返回 40302。
5. 错词自动收录、错误次数累加、复习移除、错词再测出题正确。
6. 管理员后台：用户列表、套餐调整、词库增删改、题库改选项、统计数字与数据库一致。
7. 前端构建产物可部署：`client/dist` 与后端 `server/dist` 分别产出。

- [ ] **Step 3: 根目录 README**

写入内容：项目简介、目录说明、环境变量（JWT_SECRET、SMTP 配置、ADMIN 账号）、启动步骤（seed → server dev → client dev）、默认管理员账号与"上线前必须修改"提示。

- [ ] **Step 4: 最终提交**

```powershell
git add .
git commit -m "docs: final acceptance checklist and readme"
```

## 计划自审说明

- 覆盖率：需求文档（01）中词库、词义、出题、自适应、评估、验证、报告、错词本、用户、套餐、管理员全部有对应任务。
- 一致性：等级规则 `K1→K2→K3→K5→K10→K10P` 在引擎、报告、前端 LevelBadge 中统一；字段命名遵循 03 文档。
- 删除策略：`Word` 被 `TestSessionItem` 引用时（`onDelete: Restrict`）无法物理删除，避免历史快照失联；管理端改用 `status: DISABLED` 停用单词，物理删除仅对未被测试引用的词生效。
- 已知简化：`hasMeaning` 过滤、admin 用户统计中的逐用户 `Promise.all` 均为 MVP 实现，数据量增长后需优化为聚合 SQL。

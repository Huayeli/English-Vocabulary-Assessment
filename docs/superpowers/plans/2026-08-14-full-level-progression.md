# 完整等级递进 + 词汇量估算 + 答题字体 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 K4–K9 等级使 1k–10k 完整递进，词汇量估算改为“累加基准 + 当前档正确率折算”，答题英文单词改用 Times New Roman。

**Architecture:** 等级枚举与映射集中在 schema/level.ts/engine；估算统一为一个 floor+band 公式；前端等级展示列表同步扩展。

**Tech Stack:** Prisma + SQLite、Express、Vue3、Vitest。

---

### Task 1: Prisma 枚举与生成

**Files:**
- Modify: `server/prisma/schema.prisma`（enum Level 增加 K4,K6,K7,K8,K9）

- [ ] **Step 1: 修改 enum**

`enum Level { K1 K2 K3 K4 K5 K6 K7 K8 K9 K10 K10P }`

- [ ] **Step 2: 迁移与生成**

```powershell
Set-Location server
npx prisma migrate dev --name add_full_level_progression
npx prisma generate
Set-Location ..
```

### Task 2: 等级映射与引擎（TDD）

**Files:**
- Test: `server/tests/adaptive.test.ts`
- Modify: `server/src/utils/level.ts`
- Modify: `server/src/modules/test/adaptive.engine.ts`

- [ ] **Step 1: 更新失败测试**

`LEVEL_SEQUENCE` 期望改为 `[K1,K2,K3,K4,K5,K6,K7,K8,K9,K10,K10P]`；`applyLevelRules(K3,4,0)=K4`、`applyLevelRules(K4,4,0)=K5`、`applyLevelRules(K5,0,2)=K4`、`applyLevelRules(K4,0,2)=K3`。

- [ ] **Step 2: 运行确认失败**

`npx vitest run tests/adaptive.test.ts`

- [ ] **Step 3: 实现**

`level.ts` MAP 增加 `4k..9k`；`LEVEL_RANK` 增加 K4..K9；`adaptive.engine.ts` 序列补全。

- [ ] **Step 4: 运行确认通过**

`npx vitest run tests/adaptive.test.ts`

### Task 3: 词汇量估算与 CEFR/reliability（TDD）

**Files:**
- Test: `server/tests/report.test.ts`
- Modify: `server/src/modules/report/report.service.ts`
- Modify: `server/src/modules/test/reliability.service.ts`

- [ ] **Step 1: 更新失败测试**

`estimateVocabulary(K5, [K5:对],[K5:错]) = 4500`；`estimateVocabulary(K5, [K5:对]) = 5000`；`estimateVocabulary(K10, K10 全对) = 10000`；`estimateVocabulary(K10P, 对/错) = 17500`；空 items 的 K5 = 4500。

- [ ] **Step 2: 运行确认失败**

`npx vitest run tests/report.test.ts`

- [ ] **Step 3: 实现**

`report.service.ts`：CEFR 增加 K4..K9；`estimateVocabulary` 改为 floor+band×mastery。`reliability.service.ts` rank 补全。

- [ ] **Step 4: 运行确认通过**

`npx vitest run tests/report.test.ts tests/adaptive.test.ts`

### Task 4: 接口白名单与 API 测试

**Files:**
- Modify: `server/src/modules/admin/admin.controller.ts`、`server/src/modules/vocabulary/vocabulary.controller.ts`、`server/src/modules/test/test.controller.ts`
- Test: `server/tests/test.api.test.ts`

- [ ] **Step 1: 更新测试**

“4 连对后 nextQuestion.testedLevel = K4”；其余用例保持。

- [ ] **Step 2: 实现**

三处 `LEVELS` 集合补 K4..K9。

- [ ] **Step 3: 全量测试**

`npx vitest run`

### Task 5: 前端等级展示与字体

**Files:**
- Modify: `client/src/views/test/VerificationTest.vue`、`client/src/views/admin/AdminWords.vue`、`client/src/components/RateBar.vue`、`client/src/views/admin/AdminDashboard.vue`、`client/src/components/QuestionCard.vue`

- [ ] **Step 1: 补等级列表/颜色**

各处 `LEVEL_INFO`/`LEVELS`/`LEVEL_COLORS` 增加 4K–9K。

- [ ] **Step 2: 字体**

`.q-word` 改为 `font-family: "Times New Roman", Times, serif;`

- [ ] **Step 3: 构建**

```powershell
Set-Location client
npm run build
Set-Location ..
```

### Task 6: 数据库重灌与验收

- [ ] **Step 1: 重新 seed**

```powershell
Set-Location server
npm run seed
Set-Location ..
```

- [ ] **Step 2: 验证词数**

查询各等级词数：K1–K10 各约 1000、K10P 约 15001、总数 25001。

- [ ] **Step 3: 全量回归**

`server: npx vitest run`；`client: npm run build`

### Task 7: 文档与提交

- [ ] **Step 1: 更新文档**

`README.md`、`docs/01-requirements.md` 等级表与词汇量公式说明。

- [ ] **Step 2: 提交**

```powershell
git add .
git commit -m "feat: full 1k-10k level progression, performance-based vocabulary estimate, Times New Roman question font"
```

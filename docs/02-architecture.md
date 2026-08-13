# 系统架构

## 1. 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Vue Router + Axios |
| 后端 | Node.js + TypeScript + Express |
| ORM / 数据库 | Prisma + SQLite |
| 认证 | JWT（Bearer Token，有效期 7 天） |
| 密码 | bcrypt |
| 邮件 | nodemailer（163 SMTP） |
| 后端测试 | Vitest + Supertest |

## 2. 目录结构

```
English Vocabulary Assessment/
├── client/                          # Vue3 + TypeScript 前端
│   ├── public/
│   └── src/
│       ├── api/                     # Axios 封装，按模块拆文件
│       │   ├── auth.ts
│       │   ├── user.ts
│       │   ├── words.ts
│       │   ├── test.ts
│       │   ├── report.ts
│       │   ├── wrongWords.ts
│       │   └── admin.ts
│       ├── router/                  # 路由 + 登录/管理员守卫
│       ├── stores/                  # Pinia：auth / user / test
│       ├── components/              # QuestionCard、LevelBadge、RateBar 等
│       ├── views/
│       │   ├── auth/                # Login / Register / ForgotPassword
│       │   ├── test/                # TestCenter / AdaptiveTest / VerificationTest / WrongWordTest / TestResult
│       │   ├── report/              # ReportDetail
│       │   ├── wrong/               # WrongWords
│       │   ├── user/                # UserHome / UserSettings
│       │   └── admin/               # AdminUsers / AdminWords / AdminQuestions / AdminStats
│       ├── types/
│       ├── utils/
│       ├── App.vue
│       └── main.ts
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                  # 词库导入脚本
│   ├── src/
│   │   ├── index.ts                 # 启动入口
│   │   ├── app.ts                   # Express 装配
│   │   ├── config/                  # env 配置（JWT 密钥、SMTP）
│   │   ├── middleware/              # auth、requireAdmin、errorHandler
│   │   ├── utils/                   # 验证码生成、分页等
│   │   └── modules/
│   │       ├── auth/                # 注册、登录、邮箱验证码、绑定、找回密码
│   │       ├── user/                # 用户主页、个人资料
│   │       ├── vocabulary/          # 词库 + 词义管理
│   │       ├── question/            # 出题引擎
│   │       ├── test/                # 自适应 / 验证 / 错词再测流程
│   │       ├── report/              # 评估 + 报告
│   │       ├── wrong-word/          # 错词本
│   │       ├── plan/                # 套餐与权限
│   │       └── admin/               # 用户管理、题库管理、数据统计
│   ├── package.json
│   └── tsconfig.json
│
├── data/
│   ├── input.json
│   ├── output.json
│   └── BNC_COCA_lists.pdf
│
├── scripts/
│   ├── extract_bnc_coca.py
│   └── clean_json.py
│
├── docs/                            # 本设计文档
└── README.md
```

## 3. 后端模块职责

| 模块 | 职责 |
|---|---|
| auth | 注册、用户名密码登录、邮箱验证码（发送/登录/绑定/重置）、JWT 签发 |
| user | 用户主页聚合数据、个人资料修改 |
| vocabulary | 单词与词义 CRUD、查询、按等级筛选 |
| question | 五选一题目生成、干扰项选择、题库缓存（Question 表） |
| test | 三种测试流程：自适应、等级验证、错词再测；逐题提交、规则引擎、额度校验 |
| report | 掌握率计算、词汇量估算、CEFR 映射、报告输出 |
| wrong-word | 错词记录、列表、复习、移除、再测入口 |
| plan | 套餐定义、用户当前权益查询、额度校验 |
| admin | 用户管理、套餐调整、题库管理、数据统计 |

## 4. 关键设计决策

### 4.1 答题明细快照化

`TestSessionItem` 保存每题的五选项快照（JSON）和正确答案索引。题目后续被修改或删除不影响历史测试记录与报告统计。

### 4.2 题库即缓存

出题引擎按需生成题目并写入 `Question` / `QuestionOption`，同单词优先复用。管理后台由此获得"题库管理"对象（可编辑干扰项、禁用题目）。

### 4.3 权限后端强制

前端只控制入口显隐，所有套餐限制、角色校验在服务端强制执行（中间件 + 额度服务）。

### 4.4 干扰项规则

干扰项只从其他单词的中文释义抽取，优先同等级/相邻等级，并优先选择与正确答案共享关键词（相关但不一致）的释义作为混淆项，不使用目标单词的其他释义，避免 "run 的运行" 与 "跑" 同时出现导致歧义。选项共 4 个（1 正确 + 3 干扰）。

## 5. 数据流

```
data/output.json (BNC/COCA)
          +
ECDICT stardict.csv（中文释义）
          ↓
server/prisma/seed.ts（合并导入）
          ↓
SQLite（Word / WordMeaning）
          ↓
出题引擎（question 模块）→ 题目缓存（Question / QuestionOption）
          ↓
测试流程（test 模块）→ 答题明细（TestSession / TestSessionItem）
          ↓
评估与报告（report 模块）→ 错词（WrongWord）
          ↓
前端展示（测试中心 / 报告页 / 错词本 / 用户主页）
```

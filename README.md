# 英语词汇量智能评估系统

基于 BNC/COCA 词频等级的英语词汇量智能评估系统。输入激活码即可进入测试，管理后台负责生成与管理激活码、维护题库、查看测试记录。

## 功能概览

- 访问方式：激活码（无账号、无登录），一个激活码可进行所有测试并查看所有结果
- 核心等级：1K / 2K / 3K / 5K / 10K / 10K+（对应 BNC/COCA 词表）
- 自适应测试：30 题、初始 3K、连对 4 题升级、连错 2 题降级、可返回修改答案
- 等级验证：指定等级 30 题，正确率 ≥80% 判定达标
- 四选一出题：1 正确 + 3 个与答案相关的混淆项，同场不重复
- 测试报告：等级、词汇量、各等级掌握率、CEFR、完成时间
- 管理后台（管理密钥保护）：全局统计、题库管理（单词/词义/题目）、测试管理、激活码管理
- 激活码：可批量生成（1-100 个/次）、设置每个码可测次数（留空=不限）、按批次/状态/关键词筛选、启停用、批量删除/修改、查看每码考试结果

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Axios
- 后端：Node.js + TypeScript + Express + Prisma 7
- 数据库：SQLite（libsql 适配器）
- 测试：Vitest + Supertest（后端）

## 快速开始

环境要求：Node.js 20+、npm。

### 1. 准备词库数据（约 65MB，一次即可）

```powershell
Invoke-WebRequest -Uri "https://ghfast.top/https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv" -OutFile "data\ecdict.csv"
```

### 2. 配置后端

```powershell
cd server
Copy-Item .env.example .env
```

修改 `server/.env` 中的 `ADMIN_KEY`（管理后台密钥，默认 `REDACTED`）。

### 3. 初始化数据库与词库

```powershell
cd server
npx prisma migrate dev
npm run seed
```

### 4. 启动

```powershell
# 后端 http://localhost:3000
cd server
npm run dev

# 前端 http://localhost:5173
cd client
npm run dev
```

### 5. 使用流程

1. 打开前端 → 右上角“管理后台” → 输入管理密钥（`ADMIN_KEY`）。
2. 在“激活码管理”生成一批激活码（设置批次名、数量 1-100、每码次数或留空不限）。
3. 把激活码发给用户；用户在访问页输入激活码即可进入测试中心。

## 测试与构建

```powershell
cd server
npm test
npm run build

cd client
npm run build
```

## 文档

设计文档见 [docs/](docs/README.md)。

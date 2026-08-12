# 英语词汇量智能评估系统

基于 BNC/COCA 词频等级的英语词汇量智能评估系统。通过五选一选择题进行自适应测试与等级验证，输出词汇量评估报告，并附带错词本、套餐权限与管理后台。

## 功能概览

- 核心等级：1K / 2K / 3K / 5K / 10K / 10K+（对应 BNC/COCA 词表，10K+ 为 11k-25k）
- 自适应测试：固定 30 题，初始 3K，连续答对 4 题升一级、连续答错 2 题降一级
- 等级验证：指定等级 30 题，正确率 ≥80% 判定达标
- 测试报告：等级、词汇量、各等级掌握率、CEFR 参考、错词摘要
- 错词本：自动收录、错误次数累计、复习与再测
- 用户系统：用户名密码登录 + 邮箱验证码登录（163 SMTP）
- 套餐权限：免费体验 / 单次测试 / 月卡 / 年卡（仅权限管理，不接支付）
- 管理后台：用户管理、词库管理、题库管理、数据统计

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Axios
- 后端：Node.js + TypeScript + Express + Prisma 7
- 数据库：SQLite（libsql 驱动适配器）
- 认证：JWT + bcrypt；邮件：nodemailer（163 SMTP）
- 测试：Vitest + Supertest（后端）

## 目录结构

```
client/   前端（Vue3）
server/   后端（Express + Prisma）
data/     词库数据（BNC/COCA + ECDICT）
scripts/  词库处理脚本（Python）
docs/     设计文档与实现计划
```

## 快速开始

环境要求：Node.js 20+、npm。

### 1. 准备词库数据

ECDICT 中文释义约 65MB，需下载一次（已加入 `.gitignore`）：

```powershell
Invoke-WebRequest -Uri "https://ghfast.top/https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv" -OutFile "data\ecdict.csv"
```

如果镜像不可用，可改用 `https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv` 直连。

### 2. 配置后端

```powershell
cd server
Copy-Item .env.example .env
```

按需修改 `server/.env` 中的 `JWT_SECRET`、SMTP 配置（163 邮箱 + SMTP 授权码）、默认管理员账号。

### 3. 初始化数据库与词库

```powershell
cd server
npx prisma migrate dev
npm run seed
```

导入预期结果：约 20,001 个单词（6 个系统等级）、3 万余条中文词义。4k、6k-9k 词表不属于系统等级，导入时跳过。

### 4. 启动开发环境

```powershell
# 终端 1：后端 http://localhost:3000
cd server
npm run dev

# 终端 2：前端 http://localhost:5173
cd client
npm run dev
```

### 5. 默认管理员

`admin / REDACTED`（由 `server/.env` 中 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 控制）。**上线前必须修改默认密码。**

## 测试与构建

```powershell
cd server
npm test        # 后端测试
npm run build   # 后端构建（dist/）

cd client
npm run build   # 前端构建（dist/）
```

## 文档

设计文档、数据库设计、API 接口与实现计划见 [docs/](docs/README.md)。

## 分支说明

开发在 `dev/implementation` 分支进行。

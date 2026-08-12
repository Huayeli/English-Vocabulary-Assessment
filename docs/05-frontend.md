# 前端页面规划

技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Axios。

## 1. 路由表

| 路径 | 页面 | 权限 | 说明 |
|---|---|---|---|
| /login | Login | 公开 | 用户名密码 / 邮箱验证码两个 Tab |
| /register | Register | 公开 | 注册（用户名、密码、邮箱可选） |
| /forgot | ForgotPassword | 公开 | 邮箱验证码找回密码 |
| / | TestCenter | 登录 | 测试中心首页 |
| /test/adaptive | AdaptiveTest | 登录 | 自适应测试答题 |
| /test/verification | VerificationTest | 月卡/年卡 | 选等级 → 答题 |
| /test/wrong | WrongWordTest | 月卡/年卡 | 错词再测答题 |
| /test/result/:sessionId | TestResult | 登录 | 测试结果摘要 |
| /report/:sessionId | ReportDetail | 登录 | 完整报告 |
| /wrong-words | WrongWords | 月卡/年卡 | 错词本 |
| /user | UserHome | 登录 | 用户主页 |
| /user/settings | UserSettings | 登录 | 头像、绑定邮箱、修改密码 |
| /admin/users | AdminUsers | 管理员 | 用户管理 |
| /admin/words | AdminWords | 管理员 | 词库管理 |
| /admin/questions | AdminQuestions | 管理员 | 题库管理 |
| /admin/stats | AdminStats | 管理员 | 数据统计 |

## 2. 页面职责

### 2.1 登录页 /login

- Tab 1：用户名 + 密码登录。
- Tab 2：邮箱验证码登录：输入邮箱 → 发送验证码（60 秒倒计时）→ 输入 6 位验证码 → 登录。
- 登录成功后按角色跳转：管理员进 /admin/users，普通用户进 /。

### 2.2 注册页 /register

- 用户名、密码、确认密码、邮箱（选填）。
- 校验用户名唯一性（前端预检 + 后端报错展示）。

### 2.3 找回密码 /forgot

- 输入已绑定邮箱 → 发送验证码 → 输入新密码 → 完成重置 → 跳登录页。

### 2.4 测试中心 /（首页）

- 套餐卡片与今日剩余次数。
- 三个测试入口卡片：自适应测试、等级验证、错词再测。
- 未开通入口置灰并显示"升级套餐"提示。
- 最近一次测试结果摘要（如果有）。

### 2.5 答题页（自适应 / 验证 / 错词再测共用）

- 顶部进度条：第 n / 30 题。
- 题目卡片：单词 + "xxx是什么意思？" + 5 个选项。
- 提交后即时反馈：对错 + 正确答案高亮，3 秒后进入下一题。
- 防重复提交（提交后锁定选项）。
- 答完最后一题自动跳转结果页。

### 2.6 测试结果页 /test/result/:sessionId

- 大字展示：当前等级、预计词汇量、正确率。
- 按钮进入完整报告。

### 2.7 报告页 /report/:sessionId

- 测试时间、类型、题数、正确率。
- 各等级掌握率条形图（RateBar）。
- CEFR 参考。
- 错词摘要。

### 2.8 错词本 /wrong-words

- 单词卡片列表：单词、等级徽章、错误次数、正确释义、最近错误时间。
- 操作：错词再测（进入 /test/wrong）、单条复习、移出错词本。

### 2.9 用户主页 /user

- 头像、用户名、套餐徽章。
- 统计卡片：当前词汇量、当前等级、测试次数、错词数量。
- 历史测试列表（点击进入报告）。

### 2.10 账号设置 /user/settings

- 修改头像（URL 或本地上传预留）。
- 绑定邮箱（发送验证码 → 输入验证码 → 绑定）。
- 修改密码（找回流程之外的可选补充）。

### 2.11 管理后台

- AdminLayout：左侧菜单（用户管理 / 词库管理 / 题库管理 / 数据统计）。
- 用户管理：表格 + 搜索（用户名/邮箱/套餐）+ 套餐调整弹窗。
- 词库管理：搜索（关键词/等级/无释义）+ 单词列表 + 编辑弹窗（等级、词族、词义增删改）。
- 题库管理：搜索 + 题目列表 + 编辑弹窗（改选项/正确答案/禁用）。
- 数据统计：统计卡片（用户数、测试次数、平均词汇量）+ 等级分布条形图。

## 3. 关键组件

| 组件 | 用途 |
|---|---|
| QuestionCard | 题目 + 5 选项 + 答题反馈 |
| LevelBadge | 等级徽章（K1..K10+） |
| RateBar | 掌握率条形图 |
| PackageCard | 套餐权益卡片 |
| StatCard | 统计数字卡片 |
| TestProgress | 答题进度条 |
| CodeInput | 验证码输入 + 倒计时 |
| EmptyState | 空列表占位 |

## 4. 状态管理（Pinia）

| store | 状态 |
|---|---|
| auth | token、当前用户、登录/注册/登出动作 |
| user | 主页数据、套餐信息 |
| test | 进行中的会话：sessionId、当前题、进度、连续对错状态 |

token 持久化到 localStorage，Axios 请求拦截器自动附加 `Authorization`，响应拦截器统一处理 `code != 0` 与 401 跳转登录。

## 5. 权限守卫

- `authGuard`：未登录跳 /login。
- `adminGuard`：非管理员跳 /。
- 套餐入口（等级验证、错词本）：前端按 `/api/tests/quota` 结果控制显隐；后端接口仍强制校验，前端仅做体验优化。

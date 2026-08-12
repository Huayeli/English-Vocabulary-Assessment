# API 接口设计

## 1. 接口约定

- 基础路径：`/api`。
- 数据格式：JSON。
- 认证：`Authorization: Bearer <token>`，JWT 有效期 7 天。
- 统一响应：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code != 0` 表示业务错误，`message` 为中文提示。
- 分页参数：`page`、`pageSize`，响应 `{ list, total, page, pageSize }`。
- 权限分档：公开 / 登录 / 管理员。

## 2. 错误码

| code | 含义 |
|---|---|
| 40101 | 未登录或 token 失效 |
| 40102 | 用户名或密码错误 |
| 40103 | 验证码错误或已过期 |
| 40104 | 验证码发送过于频繁（60 秒内） |
| 40301 | 无管理员权限 |
| 40302 | 套餐限制（次数用完 / 功能未开通） |
| 40401 | 资源不存在 |
| 40901 | 用户名已存在 |
| 40902 | 邮箱已被绑定 |

## 3. 认证模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | /auth/register | 公开 | 注册 |
| POST | /auth/login | 公开 | 用户名 + 密码登录 |
| POST | /auth/email-code | 公开 | 发送登录验证码（邮箱需已绑定） |
| POST | /auth/login-by-email | 公开 | 邮箱验证码登录 |
| POST | /auth/bind-email-code | 登录 | 发送绑定验证码 |
| POST | /auth/bind-email | 登录 | 完成邮箱绑定 |
| POST | /auth/reset-password-code | 公开 | 发送找回密码验证码 |
| POST | /auth/reset-password | 公开 | 重置密码 |
| GET | /auth/me | 登录 | 当前用户信息 |

### 3.1 注册

`POST /api/auth/register`

```json
// 请求
{ "username": "alice", "password": "secret123", "email": "alice@example.com" }

// 响应
{
  "code": 0,
  "message": "ok",
  "data": { "token": "<jwt>", "user": { "id": 1, "username": "alice", "email": "alice@example.com" } }
}
```

规则：用户名唯一；密码 bcrypt 加密；默认套餐 FREE；邮箱重复返回 40902。

### 3.2 用户名密码登录

`POST /api/auth/login`

```json
// 请求
{ "username": "alice", "password": "secret123" }

// 响应
{ "code": 0, "data": { "token": "<jwt>", "user": { "id": 1, "username": "alice" } } }
```

失败返回 40102。

### 3.3 发送邮箱验证码

`POST /api/auth/email-code`（登录场景，邮箱必须已绑定）

```json
// 请求
{ "email": "alice@example.com" }

// 响应
{ "code": 0, "data": null }
```

规则：生成 6 位数字；`purpose=LOGIN`；5 分钟有效；同一邮箱 60 秒内重复发送返回 40104。

### 3.4 邮箱验证码登录

`POST /api/auth/login-by-email`

```json
// 请求
{ "email": "alice@example.com", "code": "123456" }

// 响应
{ "code": 0, "data": { "token": "<jwt>", "user": { "id": 1, "username": "alice" } } }
```

规则：校验 email + purpose=LOGIN + code + 未过期 + 未使用；成功后 `used=true` 立即作废；失败返回 40103。

### 3.5 绑定邮箱

`POST /api/auth/bind-email-code`（已登录，发送 purpose=BIND 验证码）

`POST /api/auth/bind-email`（已登录）

```json
// 请求
{ "email": "alice@example.com", "code": "123456" }

// 响应
{ "code": 0, "data": { "email": "alice@example.com" } }
```

### 3.6 找回密码

`POST /api/auth/reset-password-code`（发送 purpose=RESET 验证码到已绑定邮箱）

`POST /api/auth/reset-password`

```json
// 请求
{ "email": "alice@example.com", "code": "123456", "newPassword": "newsecret123" }

// 响应
{ "code": 0, "data": null }
```

### 3.7 当前用户

`GET /api/auth/me` → `{ code: 0, data: { id, username, email, avatar, packageCode, packageName, packageExpireTime, remainingTestCount } }`

## 4. 用户模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /user/home | 登录 | 主页聚合 |
| PUT | /user/profile | 登录 | 修改头像等 |

### 4.1 用户主页

`GET /api/user/home`

```json
{
  "code": 0,
  "data": {
    "currentLevel": "K5",
    "estimatedVocabulary": 5000,
    "testCount": 12,
    "wrongWordCount": 8,
    "package": { "code": "MONTHLY", "name": "月卡" },
    "recentTests": [
      { "id": 101, "type": "ADAPTIVE", "finalLevel": "K5", "accuracy": 0.73, "finishedTime": "2026-08-12T10:00:00Z" }
    ]
  }
}
```

### 4.2 修改个人资料

`PUT /api/user/profile` → 请求 `{ "avatar": "https://..." }`

## 5. 词库与词义管理

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /words | 登录 | 查询：`keyword`、`level`、`hasMeaning`、分页 |
| GET | /words/:id | 登录 | 详情，含词义列表 |
| POST | /words | 管理员 | 新增单词（可带词义数组） |
| PUT | /words/:id | 管理员 | 修改等级、词族、状态 |
| DELETE | /words/:id | 管理员 | 删除（级联词义、题目） |
| POST | /words/:id/meanings | 管理员 | 新增词义 |
| PUT | /meanings/:id | 管理员 | 修改词义 |
| DELETE | /meanings/:id | 管理员 | 删除词义 |

### 5.1 单词列表

`GET /api/words?keyword=ab&level=K3&hasMeaning=true&page=1&pageSize=20`

```json
{
  "code": 0,
  "data": {
    "list": [
      { "id": 12, "headword": "abandon", "level": "K3", "bncLevel": "3k", "meaningCount": 2, "status": "ENABLED" }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 5.2 新增单词

`POST /api/words`

```json
{ "headword": "abandon", "level": "K3", "bncLevel": "3k", "relatedForms": "abandon, abandoned", "meanings": ["抛弃、放弃", "离开"] }
```

## 6. 测试模块

答题过程中题目不返回正确答案：

```json
{
  "seq": 1,
  "word": "abandon",
  "question": "abandon是什么意思？",
  "options": ["抛弃、放弃", "接受", "维持", "改进", "恢复"],
  "testedLevel": "K3"
}
```

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /tests/quota | 登录 | 今日剩余次数 + 可用功能 |
| POST | /tests/adaptive/start | 登录 | 开始自适应测试 |
| POST | /tests/verification/start | 登录 | 开始等级验证（月卡/年卡） |
| POST | /tests/wrong-word/start | 登录 | 错词再测（月卡/年卡，10 题） |
| POST | /tests/:sessionId/answer | 登录 | 提交单题答案 |
| GET | /tests/:sessionId | 登录 | 测试明细（本人或管理员） |
| GET | /tests | 登录 | 测试历史（`type` 筛选、分页） |
| POST | /tests/:sessionId/abandon | 登录 | 放弃测试（不生成报告、不扣次数） |

### 6.1 今日额度

`GET /api/tests/quota`

```json
{
  "code": 0,
  "data": {
    "packageCode": "FREE",
    "remainingDailyTests": 1,
    "verificationEnabled": false,
    "wrongBookEnabled": false
  }
}
```

### 6.2 开始自适应测试

`POST /api/tests/adaptive/start`

```json
// 响应
{
  "code": 0,
  "data": {
    "sessionId": 201,
    "totalQuestions": 30,
    "currentLevel": "K3",
    "question": { "seq": 1, "word": "abandon", "question": "abandon是什么意思？", "options": ["..."] }
  }
}
```

额度规则：免费套餐校验当日次数（预扣，完成或放弃后按规则结算）；SINGLE 扣 `remaining_test_count`；MONTHLY/YEARLY 不限。免费/单次不消耗历史权限的查看限制（历史接口独立控制）。

### 6.3 提交答案

`POST /api/tests/:sessionId/answer`

```json
// 请求
{ "optionIndex": 0, "answerTimeMs": 5300 }

// 响应（未完成）
{
  "code": 0,
  "data": {
    "isCorrect": true,
    "correctIndex": 0,
    "currentLevel": "K5",
    "finished": false,
    "nextQuestion": { "seq": 2, "word": "...", "options": ["..."] }
  }
}

// 响应（第 30 题答完）
{
  "code": 0,
  "data": {
    "isCorrect": true,
    "correctIndex": 0,
    "currentLevel": "K5",
    "finished": true,
    "reportId": 301
  }
}
```

自适应等级规则：连对 4 题升一级；连错 2 题降一级；等级序列 `K1→K2→K3→K5→K10→K10P`；1K 不降、10K+ 不升。

### 6.4 测试明细

`GET /api/tests/:sessionId`

```json
{
  "code": 0,
  "data": {
    "id": 201,
    "type": "ADAPTIVE",
    "totalQuestions": 30,
    "correctCount": 22,
    "wrongCount": 8,
    "finalLevel": "K5",
    "estimatedVocabulary": 5000,
    "items": [
      { "seq": 1, "word": "abandon", "testedLevel": "K3", "options": ["..."], "correctIndex": 0, "userIndex": 0, "isCorrect": true, "answerTimeMs": 5300 }
    ]
  }
}
```

## 7. 报告模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /reports/:sessionId | 登录 | 完整报告 |
| GET | /reports | 登录 | 历史报告列表 |

`GET /api/reports/:sessionId`

```json
{
  "code": 0,
  "data": {
    "sessionId": 201,
    "testTime": "2026-08-12T10:00:00Z",
    "type": "ADAPTIVE",
    "totalQuestions": 30,
    "correctCount": 22,
    "accuracy": 0.73,
    "finalLevel": "K5",
    "estimatedVocabulary": 5000,
    "cefr": "B2",
    "levelMastery": [
      { "level": "K1", "answered": 2, "correct": 2, "rate": 1.0 },
      { "level": "K2", "answered": 4, "correct": 4, "rate": 1.0 },
      { "level": "K3", "answered": 10, "correct": 8, "rate": 0.8 },
      { "level": "K5", "answered": 14, "correct": 8, "rate": 0.57 }
    ],
    "wrongWords": [
      { "wordId": 88, "headword": "obscure", "correctMeaning": "晦涩的" }
    ]
  }
}
```

## 8. 错词本模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /wrong-words | 登录 | 错词列表（错误次数排序、分页） |
| DELETE | /wrong-words/:id | 登录 | 移出错词本 |
| POST | /wrong-words/:id/review | 登录 | 单词语义复习，标记已掌握移除 |

`GET /api/wrong-words`

```json
{
  "code": 0,
  "data": {
    "list": [
      { "id": 5, "headword": "abandon", "level": "K3", "correctMeaning": "抛弃、放弃", "errorCount": 3, "lastErrorTime": "2026-08-12T10:00:00Z" }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

## 9. 套餐模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /plans | 公开 | 套餐列表（仅权益，无价格） |
| GET | /user/plan | 登录 | 我的套餐与剩余权益 |

`GET /api/plans`

```json
{
  "code": 0,
  "data": {
    "list": [
      { "code": "FREE", "name": "免费体验", "dailyTestLimit": 1, "verificationEnabled": false, "wrongBookEnabled": false, "reportLevel": "BASIC" },
      { "code": "SINGLE", "name": "单次测试", "dailyTestLimit": null, "reportLevel": "FULL" },
      { "code": "MONTHLY", "name": "月卡", "dailyTestLimit": null, "verificationEnabled": true, "wrongBookEnabled": true, "historyEnabled": true },
      { "code": "YEARLY", "name": "年卡", "dailyTestLimit": null, "verificationEnabled": true, "wrongBookEnabled": true, "historyEnabled": true }
    ]
  }
}
```

## 10. 管理员模块

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | /admin/users | 管理员 | 用户列表（信息、测试次数、当前等级、套餐） |
| GET | /admin/users/:id | 管理员 | 用户详情 |
| PUT | /admin/users/:id/package | 管理员 | 调整套餐 / 到期时间 / 剩余次数 |
| GET | /admin/questions | 管理员 | 题库列表（等级、单词筛选） |
| POST | /admin/questions | 管理员 | 人工录题 |
| PUT | /admin/questions/:id | 管理员 | 修改答案 / 干扰项 / 禁用 |
| DELETE | /admin/questions/:id | 管理员 | 删除题目 |
| GET | /admin/stats/overview | 管理员 | 数据统计总览 |

### 10.1 用户列表

`GET /api/admin/users?keyword=&package=&page=1&pageSize=20`

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "alice",
        "email": "alice@example.com",
        "packageCode": "MONTHLY",
        "testCount": 12,
        "currentLevel": "K5",
        "status": "NORMAL"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 10.2 题库列表

`GET /api/admin/questions?keyword=abandon&level=K3&page=1&pageSize=20`

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 55,
        "headword": "abandon",
        "level": "K3",
        "correctMeaning": "抛弃、放弃",
        "options": [
          { "text": "抛弃、放弃", "isCorrect": true },
          { "text": "接受", "isCorrect": false },
          { "text": "维持", "isCorrect": false },
          { "text": "改进", "isCorrect": false },
          { "text": "恢复", "isCorrect": false }
        ],
        "source": "GENERATED",
        "disabled": false
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### 10.3 数据统计总览

`GET /api/admin/stats/overview`

```json
{
  "code": 0,
  "data": {
    "userCount": 120,
    "testCount": 860,
    "averageVocabulary": 4200,
    "levelDistribution": [
      { "level": "K1", "count": 5 },
      { "level": "K2", "count": 12 },
      { "level": "K3", "count": 40 },
      { "level": "K5", "count": 35 },
      { "level": "K10", "count": 20 },
      { "level": "K10P", "count": 8 }
    ]
  }
}
```

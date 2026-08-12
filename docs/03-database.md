# 数据库设计

数据库：SQLite，ORM：Prisma。共 10 张表。

## 1. 表清单

| 表 | 用途 |
|---|---|
| User | 用户与套餐归属 |
| VerificationCode | 邮箱验证码 |
| Plan | 套餐定义 |
| Word | 单词 + K 等级 |
| WordMeaning | 中文词义（一词多义） |
| Question | 五选一题目（题库缓存） |
| QuestionOption | 题目选项 |
| TestSession | 测试记录 |
| TestSessionItem | 逐题答题明细（快照） |
| WrongWord | 错词本 |

## 2. 枚举与常量

### Level（等级）

```
K1  K2  K3  K5  K10  K10P
```

对应 BNC/COCA 词表：1k、2k、3k、5k、10k、11k-25k。

### 其他枚举（字符串存储）

- User.role：`USER` / `ADMIN`
- User.status：`NORMAL` / `DISABLED`
- Plan.code：`FREE` / `SINGLE` / `MONTHLY` / `YEARLY`
- Plan.reportLevel：`BASIC` / `FULL`
- VerificationCode.purpose：`LOGIN` / `BIND` / `RESET`
- Question.source：`GENERATED` / `MANUAL`
- TestSession.type：`ADAPTIVE` / `VERIFICATION` / `WRONG_WORD`

## 3. 表结构

### 3.1 User（用户）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| username | String | 唯一 | 登录名 |
| password_hash | String | | bcrypt 加密，不存明文 |
| email | String | 唯一、可空 | 可选绑定 |
| avatar | String | 可空 | 头像 URL |
| package_id | Int | FK -> Plan | 当前套餐 |
| package_expire_time | DateTime | 可空 | 月卡/年卡到期时间；单次/免费可空 |
| remaining_test_count | Int | 默认 0 | 单次测试剩余次数 |
| status | String | 默认 NORMAL | 管理员禁用 |
| created_time | DateTime | 默认 now | |
| updated_time | DateTime | 自动更新 | |

### 3.2 VerificationCode（邮箱验证码）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| email | String | 索引 | |
| purpose | String | | LOGIN / BIND / RESET |
| code | String | | 6 位数字 |
| expire_time | DateTime | | 5 分钟有效 |
| used | Boolean | 默认 false | 验证成功后置 true |
| created_time | DateTime | 默认 now | 用于 60 秒限频判断 |

### 3.3 Plan（套餐定义）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| code | String | 唯一 | FREE / SINGLE / MONTHLY / YEARLY |
| name | String | | 免费体验 / 单次测试 / 月卡 / 年卡 |
| daily_test_limit | Int | 可空 | 每日测试上限，null 表示不限 |
| verification_enabled | Boolean | 默认 false | 等级验证 |
| wrong_book_enabled | Boolean | 默认 false | 错词本 |
| history_enabled | Boolean | 默认 false | 历史记录 |
| report_level | String | 默认 BASIC | BASIC / FULL |
| price_cents | Int | 默认 0 | 预留，不开发支付 |
| sort_order | Int | | 展示顺序 |

套餐初始数据：

| code | name | daily_test_limit | verification | wrong_book | history | report |
|---|---|---|---|---|---|---|
| FREE | 免费体验 | 1 | false | false | false | BASIC |
| SINGLE | 单次测试 | null | false | false | false | FULL |
| MONTHLY | 月卡 | null | true | true | true | FULL |
| YEARLY | 年卡 | null | true | true | true | FULL |

### 3.4 Word（单词）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| headword | String | 唯一 | 如 abandon |
| level | Level | | 系统等级 K1..K10P |
| bnc_level | String | | 原始等级 1k..25k，追溯用 |
| related_forms | String | 可空 | 词族形式，逗号分隔 |
| status | String | 默认 ENABLED | ENABLED / DISABLED |
| created_time | DateTime | 默认 now | |
| updated_time | DateTime | 自动更新 | |

### 3.5 WordMeaning（中文词义）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| word_id | Int | FK -> Word | |
| meaning | String | | 如 "抛弃、放弃" |
| sort_order | Int | | 同词释义排序 |

唯一约束：`(word_id, meaning)`。

### 3.6 Question（题目）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| word_id | Int | FK -> Word | 题干单词 |
| correct_meaning_id | Int | FK -> WordMeaning | 正确答案释义 |
| level | Level | | 冗余等级，按等级出题用 |
| source | String | 默认 GENERATED | GENERATED / MANUAL |
| disabled | Boolean | 默认 false | 管理员禁用 |
| created_time | DateTime | 默认 now | |
| updated_time | DateTime | 自动更新 | |

唯一约束：`(word_id, correct_meaning_id)`。

### 3.7 QuestionOption（题目选项）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| question_id | Int | FK -> Question | |
| meaning_id | Int | FK -> WordMeaning，可空 | 自动生成题关联释义 |
| text | String | | 选项显示文本 |
| is_correct | Boolean | | 是否正确答案 |
| sort_order | Int | | 选项顺序 |

### 3.8 TestSession（测试记录）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| user_id | Int | FK -> User | |
| type | String | | ADAPTIVE / VERIFICATION / WRONG_WORD |
| target_level | Level | 可空 | 验证测试目标等级 |
| total_questions | Int | 默认 30 | |
| correct_count | Int | 默认 0 | |
| wrong_count | Int | 默认 0 | |
| final_level | Level | 可空 | 评估出的当前等级 |
| estimated_vocabulary | Int | 可空 | 预计词汇量 |
| accuracy | Float | 可空 | 正确率 |
| started_time | DateTime | 默认 now | |
| finished_time | DateTime | 可空 | |

索引：`(user_id, started_time)`、`type`。

### 3.9 TestSessionItem（答题明细）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| session_id | Int | FK -> TestSession | |
| seq | Int | | 第 1..30 题 |
| word_id | Int | FK -> Word | |
| tested_level | Level | | 出题时所在等级（自适应记录用） |
| options_snapshot | String | | JSON：5 个选项文本 + 正确索引 |
| correct_option_index | Int | | |
| user_option_index | Int | 可空 | 用户选择；null 表示放弃/未答 |
| is_correct | Boolean | | |
| answer_time_ms | Int | | 答题耗时 |
| created_time | DateTime | 默认 now | |

索引：`session_id`。

### 3.10 WrongWord（错词本）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Int | PK 自增 | |
| user_id | Int | FK -> User | |
| word_id | Int | FK -> Word | |
| correct_meaning_text | String | | 正确释义快照 |
| error_count | Int | 默认 1 | 累加 |
| last_error_time | DateTime | 默认 now | |
| created_time | DateTime | 默认 now | |

唯一约束：`(user_id, word_id)`。

## 4. 关系图

```
Plan 1 ── N User 1 ── N TestSession 1 ── N TestSessionItem
                 │          N
                 └── N WrongWord ── N Word 1 ── N WordMeaning
                                        │
                                        └── 1 Question 1 ── N QuestionOption

User 1 ── N VerificationCode（无 FK 关联，按 email 查询）
```

## 5. 主要查询设计

- 每日测试次数：按 `TestSession(user_id, started_time)` 统计当天记录数（仅计算完成且未放弃的会话）。
- 各等级掌握率：按 `TestSessionItem.tested_level` 分组统计正确数/答题数。
- 等级分布（管理后台）：取每个用户最近一次完成的 `TestSession.final_level` 分组统计。
- 平均词汇量：所有用户最近一次 `TestSession.estimated_vocabulary` 的平均值。
- 待补充释义词：`Word` 左连接 `WordMeaning` 统计词义数为 0 的单词。

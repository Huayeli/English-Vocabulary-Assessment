# 英语词汇量智能评估系统 - 设计文档

基于 BNC/COCA 词频等级的英语词汇量智能评估系统。本文档为正式设计基线，实现开始前以此为准。

## 文档索引

| 文档 | 内容 | 状态 |
|---|---|---|
| [01-requirements.md](01-requirements.md) | 需求基线：等级定义、测试规则、套餐矩阵、邮箱登录规则 | 已确认 |
| [02-architecture.md](02-architecture.md) | 技术栈、目录结构、后端模块、前端结构、数据流 | 已确认 |
| [03-database.md](03-database.md) | 数据库表设计：10 张表、字段字典、索引、关系 | 已确认 |
| [04-api.md](04-api.md) | API 接口设计：约定、错误码、全部端点与示例 | 已确认 |
| [05-frontend.md](05-frontend.md) | 前端页面规划：路由、页面、组件、权限守卫 | 已确认 |
| [06-data-pipeline.md](06-data-pipeline.md) | 词库导入：BNC/COCA + ECDICT 合并流程 | 已确认 |
| [07-implementation-plan.md](07-implementation-plan.md) | 实现计划：分阶段任务与验收 | 待执行 |

## 阅读顺序

1. 先读 [01-requirements.md](01-requirements.md) 了解业务规则。
2. 再读 [02-architecture.md](02-architecture.md) 和 [03-database.md](03-database.md) 了解整体结构与数据模型。
3. 接口与页面细节参考 [04-api.md](04-api.md) 和 [05-frontend.md](05-frontend.md)。
4. 词库数据处理参考 [06-data-pipeline.md](06-data-pipeline.md)。
5. 开始编码后按 [07-implementation-plan.md](07-implementation-plan.md) 执行。

## 当前状态

- 设计基线：已确认
- 代码：已实现（见 [07-implementation-plan.md](07-implementation-plan.md)）
- 词库原始数据：`data/output.json`（25,002 词族，1k-25k）

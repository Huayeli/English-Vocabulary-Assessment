# 词库数据管道

## 1. 数据来源

| 来源 | 内容 | 位置 |
|---|---|---|
| BNC/COCA 词族表 | 25,002 个词族，1k-25k 等级 | `data/output.json` |
| ECDICT | 中文释义（约 34 万词条） | 外部下载：https://github.com/skywind3000/ECDICT |

ECDICT 使用仓库根目录的 `ecdict.csv`（约 65MB，含 `word`、`phonetic`、`definition`、`translation` 等列），下载后放入 `data/` 目录：

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv" -OutFile "data\ecdict.csv"
```

> 说明：仓库中的 `stardict.7z` 是压缩包（需 7z 解压），根目录的 `ecdict.csv` 列结构相同且可直接下载，故统一使用 `ecdict.csv`。CSV 字段含逗号转义，解析必须使用 `csv-parse` 或等价的引号感知解析器，不能简单按逗号 split。

## 2. 等级映射

| 系统等级 | BNC/COCA 原始等级 |
|---|---|
| K1 | 1k |
| K2 | 2k |
| K3 | 3k |
| K5 | 5k |
| K10 | 10k |
| K10P | 11k - 25k |

> 注意：4k、6k、7k、8k、9k 词表不属于 6 个系统等级（5K 明确对应 5k 词表，不重新拆分），导入时跳过，不进入出题池。预期导入词数 20,001（1k+2k+3k+5k+10k=5,000，11k-25k=15,001）。

## 3. 导入流程（server/prisma/seed.ts）

1. 读取 `data/output.json`，遍历 `entries`。
2. 将 `list`（如 `3k`）映射为系统 `Level`。
3. 用 `csv-parse` 读取 `data/ecdict.csv`，构建 `headword -> translation` 索引（小写匹配；translation 为第 4 列，下标 3）。
4. 对每个词族 headword：
- 匹配 ECDICT 释义。
   - 释义按 `\n` 拆分，去除词性标记（如 `n.`、`vt.`）、空行、纯符号行，去重。
   - 最多保留前 5 条释义，写入 `WordMeaning`，`sort_order` 递增。
   - 未匹配到释义：单词照常入库，词义为空，后台可按"无释义"筛选补录。
5. `related_forms` 存入 `Word.related_forms`。
6. 全部使用 `upsert`（按 headword），脚本可重复执行，幂等。

导入完成校验：

- `Word` 总数 = 25,002。
- 各等级单词数与 `output.json` 一致。
- 存在释义的单词占比（预期较高，ECDICT 覆盖大部分常用词）。
- 输出"待补充释义"单词清单数量。

## 4. 释义清洗规则

- 拆分：ECDICT `translation` 字段以换行分隔多条释义。
- 去词性前缀：去掉行首 `n.`、`v.`、`vt.`、`vi.`、`adj.`、`adv.`、`prep.`、`conj.` 等标记。
- 去重：相同文本只保留一条。
- 截断：单条释义长度超过 50 字符截断（防御异常数据）。
- 空值过滤：去空后为空则视为未匹配。

## 5. 人工修正流程

- 管理后台"词库管理"支持按 `hasMeaning=false` 筛选未匹配单词。
- 管理员可新增/修改/删除词义，人工修正的数据即时影响出题。
- 词义数量上限：MVP 建议每个单词最多 10 条词义（后台校验）。

## 6. 与其他模块的关系

- 出题引擎依赖 `WordMeaning` 生成五选一题目。
- 出题时若目标单词没有词义，跳过该单词（由"无释义"清单保证管理员补全）。
- 词义修改不影响历史答题明细（`TestSessionItem` 已做快照）。

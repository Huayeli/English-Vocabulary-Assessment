import json
import re

# 读取原始json
with open("input.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 正则：匹配 空格(数字) 这部分
pattern = re.compile(r"\s*\(\d+\)")

for item in data["entries"]:
    rf = item["related_forms"]
    # 删除所有 (数字)
    cleaned = pattern.sub("", rf)
    item["related_forms"] = cleaned

# 写出结果
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("处理完成，已输出 output.json")
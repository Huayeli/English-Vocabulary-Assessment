<template>
  <div>
    <h2>激活码管理</h2>

    <div class="card gen">
      <h3>生成激活码</h3>
      <div class="gen-row">
        <input v-model="gen.batchName" placeholder="批次名称（必填）" />
        <input v-model.number="gen.count" type="number" min="1" max="100" placeholder="数量 1-100" />
        <input v-model="gen.maxTests" placeholder="每个码可测次数（留空=不限）" />
        <input v-model="gen.note" placeholder="批次备注（选填）" />
        <button class="btn" :disabled="generating" @click="generate">生成</button>
      </div>
      <div v-if="generated" class="result">
        <p>已生成 {{ generated.codes.length }} 个激活码（批次：{{ generated.batchName }}）：</p>
        <div class="codes">
          <span v-for="c in generated.codes" :key="c" class="code-chip">{{ c }}</span>
        </div>
        <button class="btn ghost" @click="copyCodes">复制全部</button>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="filter.batch">
        <option value="">全部批次</option>
        <option v-for="b in batches" :key="b.id" :value="b.name">{{ b.name }}</option>
      </select>
      <select v-model="filter.status">
        <option value="">全部状态</option>
        <option value="ACTIVE">启用</option>
        <option value="DISABLED">禁用</option>
      </select>
      <input v-model="filter.keyword" placeholder="激活码" @keyup.enter="load" />
      <button class="btn" @click="load">查询</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>激活码</th>
          <th>批次</th>
          <th>已用/上限</th>
          <th>剩余</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>最近使用</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in rows" :key="c.id">
          <td class="mono">{{ c.code }}</td>
          <td>{{ c.batchName }}</td>
          <td>{{ c.usedCount }}{{ c.maxTests == null ? "" : `/${c.maxTests}` }}</td>
          <td>{{ c.remaining === null ? "不限" : c.remaining }}</td>
          <td>{{ c.status === "ACTIVE" ? "启用" : "禁用" }}</td>
          <td>{{ formatTime(c.createdAt) }}</td>
          <td>{{ formatTime(c.lastUsedAt) }}</td>
          <td>
            <button class="mini" @click="openEdit(c)">次数/状态</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="editing" class="modal">
      <div class="modal-card">
        <h3>编辑激活码 {{ editing.code }}</h3>
        <label>可测次数（留空=不限）
          <input v-model="editForm.maxTests" type="number" min="1" placeholder="留空为不限次数" />
        </label>
        <label>状态
          <select v-model="editForm.status">
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </label>
        <div class="actions">
          <button class="btn" @click="saveEdit">保存</button>
          <button class="btn ghost" @click="editing = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { adminApi } from "../../api/admin";
import { useUiStore } from "../../stores/ui";

const ui = useUiStore();
const rows = ref<any[]>([]);
const batches = ref<any[]>([]);
const generating = ref(false);
const generated = ref<any>(null);
const editing = ref<any>(null);
const editForm = reactive({ maxTests: "", status: "ACTIVE" });
const gen = reactive({ batchName: "", count: 10, maxTests: "", note: "" });
const filter = reactive({ batch: "", status: "", keyword: "" });

function formatTime(v: string | null) {
  return v ? new Date(v).toLocaleString("zh-CN") : "-";
}

async function load() {
  const res = await adminApi.codes({
    batch: filter.batch || undefined,
    status: filter.status || undefined,
    keyword: filter.keyword || undefined,
    page: 1,
    pageSize: 50
  });
  rows.value = res.list;
}

async function loadBatches() {
  batches.value = await adminApi.batches();
}

async function generate() {
  generating.value = true;
  try {
    generated.value = await adminApi.generateCodes({
      batchName: gen.batchName,
      count: gen.count,
      maxTests: gen.maxTests === "" ? null : Number(gen.maxTests),
      note: gen.note || undefined
    });
    await Promise.all([load(), loadBatches()]);
  } catch (e) {
    ui.error((e as Error).message ?? "生成失败");
  } finally {
    generating.value = false;
  }
}

async function copyCodes() {
  if (!generated.value) return;
  await navigator.clipboard.writeText(generated.value.codes.join("\n"));
  ui.error("已复制到剪贴板");
}

function openEdit(c: any) {
  editing.value = c;
  editForm.maxTests = c.maxTests == null ? "" : String(c.maxTests);
  editForm.status = c.status;
}

async function saveEdit() {
  await adminApi.updateCode(editing.value.id, {
    status: editForm.status,
    maxTests: editForm.maxTests === "" ? null : Number(editForm.maxTests)
  });
  editing.value = null;
  await load();
}

onMounted(async () => {
  await Promise.all([load(), loadBatches()]);
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}
th {
  background: #f8fafc;
}
.mono {
  font-family: Consolas, monospace;
  font-weight: 600;
}
.gen {
  padding: 20px;
  margin-bottom: 16px;
}
.gen h3 {
  margin: 0 0 12px;
}
.gen-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.gen-row input {
  flex: 1;
  min-width: 140px;
  padding: 9px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.result {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
}
.result p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}
.codes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.code-chip {
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 8px;
  padding: 5px 10px;
  font-family: Consolas, monospace;
  font-size: 13px;
}
.toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 14px 0;
}
input,
select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}
.btn.ghost {
  background: #fff;
  color: #2563eb;
  border: 1px solid #2563eb;
}
.mini {
  padding: 5px 12px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #fff;
  color: #2563eb;
  cursor: pointer;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-card {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  width: 360px;
}
label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}
label input,
label select {
  width: 100%;
  margin-top: 4px;
  box-sizing: border-box;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

<template>
  <div>
    <h2>词库管理</h2>
    <div class="toolbar">
      <input v-model="keyword" placeholder="关键词" @keyup.enter="load" />
      <select v-model="level">
        <option value="">全部等级</option>
        <option v-for="lv in LEVELS" :key="lv" :value="lv">{{ lv }}</option>
      </select>
      <select v-model="hasMeaning">
        <option value="">全部词义状态</option>
        <option value="false">无释义</option>
        <option value="true">有释义</option>
      </select>
      <button class="btn" @click="load">查询</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>单词</th>
          <th>等级</th>
          <th>原始等级</th>
          <th>词义数</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in rows" :key="w.id">
          <td>{{ w.id }}</td>
          <td>{{ w.headword }}</td>
          <td>{{ w.level }}</td>
          <td>{{ w.bncLevel }}</td>
          <td>{{ w.meaningCount }}</td>
          <td>{{ w.status }}</td>
          <td><button class="mini" @click="openEdit(w)">编辑</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="editing" class="modal">
      <div class="modal-card">
        <h3>编辑：{{ editing.headword }}</h3>
        <label>等级
          <select v-model="form.level">
            <option v-for="lv in LEVELS" :key="lv" :value="lv">{{ lv }}</option>
          </select>
        </label>
        <label>词族<input v-model="form.relatedForms" /></label>
        <label>状态
          <select v-model="form.status">
            <option value="ENABLED">启用</option>
            <option value="DISABLED">停用</option>
          </select>
        </label>
        <h4>词义</h4>
        <div v-for="m in detail?.meanings ?? []" :key="m.id" class="meaning-row">
          <input :value="m.meaning" @change="updateMeaningText(m, $event)" />
          <button class="mini danger" @click="removeMeaning(m)">删</button>
        </div>
        <div class="meaning-row">
          <input v-model="newMeaning" placeholder="新增词义" />
          <button class="mini" @click="addMeaning">加</button>
        </div>
        <div class="actions">
          <button class="btn" @click="save">保存</button>
          <button class="btn ghost" @click="editing = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";

const LEVELS = ["K1", "K2", "K3", "K5", "K10", "K10P"];
const keyword = ref("");
const level = ref("");
const hasMeaning = ref("");
const rows = ref<any[]>([]);
const editing = ref<any>(null);
const detail = ref<any>(null);
const form = ref({ level: "K1", relatedForms: "", status: "ENABLED" });
const newMeaning = ref("");

async function load() {
  const params: Record<string, unknown> = { page: 1, pageSize: 50 };
  if (keyword.value) params.keyword = keyword.value;
  if (level.value) params.level = level.value;
  if (hasMeaning.value !== "") params.hasMeaning = hasMeaning.value;
  const res = await adminApi.words(params);
  rows.value = res.list;
}

async function openEdit(w: any) {
  editing.value = w;
  detail.value = await adminApi.wordDetail(w.id);
  form.value = { level: w.level, relatedForms: w.relatedForms ?? "", status: w.status };
}

async function save() {
  await adminApi.updateWord(editing.value.id, form.value);
  editing.value = null;
  await load();
}

async function addMeaning() {
  if (!newMeaning.value) return;
  await adminApi.addMeaning(editing.value.id, newMeaning.value);
  newMeaning.value = "";
  detail.value = await adminApi.wordDetail(editing.value.id);
}

async function removeMeaning(m: any) {
  await adminApi.deleteMeaning(m.id);
  detail.value = await adminApi.wordDetail(editing.value.id);
}

async function updateMeaningText(m: any, e: Event) {
  const text = (e.target as HTMLInputElement).value;
  await adminApi.updateMeaning(m.id, text);
}

onMounted(load);
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-top: 12px;
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}
th {
  background: #f9fafb;
}
.toolbar {
  display: flex;
  gap: 8px;
}
input,
select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
.btn.ghost {
  background: #fff;
  color: #409eff;
  border: 1px solid #409eff;
}
.mini {
  padding: 5px 10px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
}
.mini.danger {
  border-color: #f87171;
  color: #dc2626;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  width: 440px;
  max-height: 80vh;
  overflow: auto;
}
label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}
select,
input {
  display: block;
  width: 100%;
  margin-top: 4px;
  box-sizing: border-box;
}
.meaning-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.meaning-row input {
  flex: 1;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

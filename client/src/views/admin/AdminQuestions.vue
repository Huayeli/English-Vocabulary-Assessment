<template>
  <div>
    <h2>题库管理</h2>
    <div class="toolbar">
      <input v-model="keyword" placeholder="单词关键词" @keyup.enter="load(1)" />
      <button class="btn" @click="load(1)">查询</button>
      <button class="btn ghost" @click="openCreate">人工录题</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>单词</th>
          <th>等级</th>
          <th>来源</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="q in rows" :key="q.id">
          <td>{{ q.id }}</td>
          <td>{{ q.headword }}</td>
          <td>{{ q.level }}</td>
          <td>{{ q.source }}</td>
          <td>{{ q.disabled ? "已禁用" : "正常" }}</td>
          <td>
            <button class="mini" @click="openEdit(q)">编辑</button>
            <button class="mini danger" @click="remove(q)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <Pagination :page="page" :page-size="pageSize" :total="total" @change="load" />

    <div v-if="editing || creating" class="modal">
      <div class="modal-card">
        <h3>{{ creating ? "人工录题" : `编辑题目：${editing.headword}` }}</h3>
        <template v-if="creating">
          <label>单词 ID<input v-model.number="createForm.wordId" type="number" /></label>
          <label>正确释义 ID<input v-model.number="createForm.correctMeaningId" type="number" /></label>
        </template>
        <div v-for="(opt, i) in options" :key="i" class="option-row">
          <input type="radio" :checked="opt.isCorrect" @change="setCorrect(i)" />
          <input v-model="opt.text" placeholder="选项文本" />
        </div>
        <div class="actions">
          <button class="btn" @click="save">{{ creating ? "创建" : "保存" }}</button>
          <button class="btn ghost" @click="close">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";
import Pagination from "../../components/Pagination.vue";

const keyword = ref("");
const rows = ref<any[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const editing = ref<any>(null);
const creating = ref(false);
const options = ref<{ text: string; isCorrect: boolean }[]>([]);
const createForm = ref({ wordId: 0, correctMeaningId: 0 });

async function load(p = 1) {
  page.value = p;
  const res = await adminApi.questions({ keyword: keyword.value, page: p, pageSize });
  rows.value = res.list;
  total.value = res.total;
}

function openEdit(q: any) {
  editing.value = q;
  creating.value = false;
  options.value = q.options.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect }));
}

function openCreate() {
  creating.value = true;
  editing.value = null;
  options.value = Array.from({ length: 4 }, () => ({ text: "", isCorrect: false }));
  options.value[0].isCorrect = true;
  createForm.value = { wordId: 0, correctMeaningId: 0 };
}

function setCorrect(i: number) {
  options.value.forEach((o, idx) => (o.isCorrect = idx === i));
}

async function save() {
  if (creating.value) {
    await adminApi.createQuestion({ ...createForm.value, options: options.value });
  } else {
    await adminApi.updateQuestion(editing.value.id, { options: options.value });
  }
  close();
  await load();
}

function remove(q: any) {
  if (!confirm(`确定删除题目 ${q.id}？`)) return;
  adminApi.deleteQuestion(q.id).then(() => load(1));
}

function close() {
  editing.value = null;
  creating.value = false;
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
input {
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
  margin-right: 6px;
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
  width: 480px;
}
.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.option-row input[type="text"] {
  flex: 1;
}
label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}
label input {
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

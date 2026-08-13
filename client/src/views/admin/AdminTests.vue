<template>
  <div>
    <h2>测试管理</h2>
    <div class="toolbar">
      <input v-model="keyword" placeholder="激活码" @keyup.enter="load(1)" />
      <select v-model="type">
        <option value="">全部类型</option>
        <option value="ADAPTIVE">自适应</option>
        <option value="VERIFICATION">等级验证</option>
        <option value="WRONG_WORD">错词再测</option>
      </select>
      <button class="btn" @click="load(1)">查询</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>激活码</th>
          <th>类型</th>
          <th>题数</th>
          <th>正确率</th>
          <th>等级</th>
          <th>完成时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in rows" :key="t.id">
          <td>{{ t.id }}</td>
          <td>{{ t.accessCode }}</td>
          <td>{{ typeLabel(t.type) }}</td>
          <td>{{ t.totalQuestions }}</td>
          <td>{{ Math.round((t.accuracy ?? 0) * 100) }}%</td>
          <td>{{ t.finalLevel ?? "-" }}</td>
          <td>{{ formatTime(t.finishedAt) }}</td>
          <td><button class="mini" @click="openDetail(t.id)">详情</button></td>
        </tr>
      </tbody>
    </table>
    <Pagination :page="page" :page-size="pageSize" :total="total" @change="load" />

    <div v-if="detail" class="modal">
      <div class="modal-card wide">
        <h3>测试详情 #{{ detail.id }} · {{ detail.code.code }}</h3>
        <p class="meta">
          类型 {{ typeLabel(detail.type) }} · 正确 {{ detail.correctCount }}/{{ detail.totalQuestions }} · 等级
          {{ detail.finalLevel ?? "-" }} · 词汇量 {{ detail.estimatedVocabulary ?? "-" }} · 完成于
          {{ formatTime(detail.finishedAt) }}
        </p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>单词</th>
              <th>等级</th>
              <th>正确选项</th>
              <th>用户选择</th>
              <th>结果</th>
              <th>用时(ms)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in detail.items" :key="it.id">
              <td>{{ it.seq }}</td>
              <td>{{ it.word.headword }}</td>
              <td>{{ it.testedLevel }}</td>
              <td>{{ optionText(it, it.correctOptionIndex) }}</td>
              <td>{{ it.userOptionIndex === null ? "-" : optionText(it, it.userOptionIndex) }}</td>
              <td :class="it.isCorrect ? 'ok' : 'bad'">{{ it.isCorrect ? "对" : "错" }}</td>
              <td>{{ it.answerTimeMs }}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn ghost" @click="detail = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";
import Pagination from "../../components/Pagination.vue";

const keyword = ref("");
const type = ref("");
const rows = ref<any[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const detail = ref<any>(null);

function typeLabel(t: string) {
  const map: Record<string, string> = { ADAPTIVE: "自适应", VERIFICATION: "等级验证", WRONG_WORD: "错词再测" };
  return map[t] ?? t;
}

function formatTime(v: string | null) {
  return v ? new Date(v).toLocaleString("zh-CN") : "-";
}

function optionText(item: any, index: number) {
  const snapshot: string[] = JSON.parse(item.optionsSnapshot);
  return snapshot[index] ?? "-";
}

async function load(p = 1) {
  page.value = p;
  const res = await adminApi.tests({
    keyword: keyword.value || undefined,
    type: type.value || undefined,
    page: p,
    pageSize
  });
  rows.value = res.list;
  total.value = res.total;
}

async function openDetail(id: number) {
  detail.value = await adminApi.testDetail(id);
}

onMounted(load);
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
.toolbar {
  display: flex;
  gap: 8px;
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
  max-width: 720px;
  max-height: 80vh;
  overflow: auto;
}
.meta {
  color: #6b7280;
  font-size: 13px;
}
.ok {
  color: #059669;
}
.bad {
  color: #dc2626;
}
</style>

<template>
  <div>
    <h2 class="page-title">词库管理</h2>
    <div class="toolbar">
      <input v-model="keyword" placeholder="关键词" @keyup.enter="load(1)" />
      <select v-model="level">
        <option value="">全部等级</option>
        <option v-for="lv in LEVELS" :key="lv" :value="lv">{{ lv }}</option>
      </select>
      <select v-model="hasMeaning">
        <option value="">全部词义状态</option>
        <option value="false">无释义</option>
        <option value="true">有释义</option>
      </select>
      <button class="btn" @click="load(1)">查询</button>
    </div>
    <div class="table-wrap">
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
          <td><span class="status-badge" :style="lvBadgeStyle(w.level)">{{ levelLabel(w.level) }}</span></td>
          <td>{{ w.bncLevel }}</td>
          <td>{{ w.meaningCount }}</td>
          <td>
            <span class="status-badge" :class="w.status === 'ENABLED' ? 'ok' : 'flat'">
              {{ w.status === "ENABLED" ? "启用" : "停用" }}
            </span>
          </td>
          <td><button class="mini" @click="openEdit(w)">编辑</button></td>
        </tr>
      </tbody>
      </table>
    </div>
    <Pagination :page="page" :page-size="pageSize" :total="total" @change="load" />

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
import Pagination from "../../components/Pagination.vue";

const LEVELS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10", "K10P"];
const keyword = ref("");
const level = ref("");
const hasMeaning = ref("");
const rows = ref<any[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const editing = ref<any>(null);
const detail = ref<any>(null);
const form = ref({ level: "K1", relatedForms: "", status: "ENABLED" });
const newMeaning = ref("");

const LEVEL_LABELS: Record<string, string> = {
  K1: "1K",
  K2: "2K",
  K3: "3K",
  K4: "4K",
  K5: "5K",
  K6: "6K",
  K7: "7K",
  K8: "8K",
  K9: "9K",
  K10: "10K",
  K10P: "10K+"
};

const LEVEL_COLORS: Record<string, string> = {
  K1: "#8E6CBB",
  K2: "#4CBFA6",
  K3: "#5B8FF9",
  K4: "#F5A623",
  K5: "#D97AB0",
  K6: "#B69CD2",
  K7: "#A2CDF3",
  K8: "#C9A7E8",
  K9: "#F8C7CE",
  K10: "#F1A9BE",
  K10P: "#E59BB4"
};

function levelLabel(level: string) {
  return LEVEL_LABELS[level] ?? level;
}

function lvBadgeStyle(level: string) {
  return { background: LEVEL_COLORS[level] ?? "#4E3282", color: "#fff" };
}

async function load(p = 1) {
  page.value = p;
  const params: Record<string, unknown> = { page: p, pageSize };
  if (keyword.value) params.keyword = keyword.value;
  if (level.value) params.level = level.value;
  if (hasMeaning.value !== "") params.hasMeaning = hasMeaning.value;
  const res = await adminApi.words(params);
  rows.value = res.list;
  total.value = res.total;
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
.meaning-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.meaning-row input {
  flex: 1;
}
</style>

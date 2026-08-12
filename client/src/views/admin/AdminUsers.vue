<template>
  <div>
    <h2>用户管理</h2>
    <div class="toolbar">
      <input v-model="keyword" placeholder="用户名 / 邮箱" @keyup.enter="load" />
      <button class="btn" @click="load">搜索</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>套餐</th>
          <th>测试次数</th>
          <th>当前等级</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email ?? "-" }}</td>
          <td>{{ u.packageCode }}</td>
          <td>{{ u.testCount }}</td>
          <td>{{ u.currentLevel ?? "-" }}</td>
          <td>{{ u.status }}</td>
          <td><button class="mini" @click="openPackage(u)">调整套餐</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="editing" class="modal">
      <div class="modal-card">
        <h3>调整套餐：{{ editing.username }}</h3>
        <label>
          套餐
          <select v-model="form.packageId" @change="syncExpire">
            <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label>到期时间<input v-model="form.expireTime" type="datetime-local" /></label>
        <label>单次剩余次数<input v-model.number="form.remainingTestCount" type="number" min="0" /></label>
        <div class="actions">
          <button class="btn" @click="savePackage">保存</button>
          <button class="btn ghost" @click="editing = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";
import { http } from "../../api/http";

const keyword = ref("");
const rows = ref<any[]>([]);
const plans = ref<any[]>([]);
const editing = ref<any>(null);
const form = ref({ packageId: 0, expireTime: "", remainingTestCount: 0 });

function expireValue(days: number) {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  const res = await adminApi.users({ keyword: keyword.value, page: 1, pageSize: 50 });
  rows.value = res.list;
}

async function openPackage(u: any) {
  editing.value = u;
  form.value = {
    packageId: u.packageCode === "FREE" ? 1 : u.packageCode === "SINGLE" ? 2 : u.packageCode === "MONTHLY" ? 3 : 4,
    expireTime: "",
    remainingTestCount: 0
  };
  syncExpire();
}

function syncExpire() {
  const days = form.value.packageId === 3 ? 30 : form.value.packageId === 4 ? 365 : 0;
  form.value.expireTime = days ? expireValue(days) : "";
}

async function savePackage() {
  await adminApi.setPackage(editing.value.id, {
    packageId: form.value.packageId,
    expireTime: form.value.expireTime ? new Date(form.value.expireTime).toISOString() : null,
    remainingTestCount: form.value.remainingTestCount
  });
  editing.value = null;
  await load();
}

onMounted(async () => {
  await load();
  const res = await http.get<{ list: any[] }>("/plans");
  plans.value = res.list;
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
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
  width: 360px;
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
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

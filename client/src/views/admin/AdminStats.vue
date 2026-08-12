<template>
  <div>
    <h2>数据统计</h2>
    <div v-if="stats" class="stats">
      <button class="stat clickable" @click="openUsers">
        <b>{{ stats.userCount }}</b>
        <span>用户数量 · 点击查看</span>
      </button>
      <button class="stat clickable" @click="openTests">
        <b>{{ stats.testCount }}</b>
        <span>测试次数 · 点击查看</span>
      </button>
      <div class="stat">
        <b>{{ stats.averageVocabulary }}</b>
        <span>平均词汇量</span>
      </div>
    </div>

    <h3>等级分布</h3>
    <div v-if="stats" class="dist">
      <div v-for="d in stats.levelDistribution" :key="d.level" class="row">
        <span class="name">{{ d.level }}</span>
        <div class="bar">
          <div class="fill" :style="{ width: `${barWidth(d.count)}%` }"></div>
        </div>
        <span class="count">{{ d.count }}</span>
      </div>
    </div>

    <!-- 用户列表 -->
    <div v-if="showUsers" class="modal">
      <div class="modal-card">
        <h3>用户列表（{{ userRows.length }}）</h3>
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>套餐</th>
              <th>测试次数</th>
              <th>当前等级</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in userRows" :key="u.id">
              <td>{{ u.username }}</td>
              <td>{{ u.email ?? "-" }}</td>
              <td>{{ u.packageCode }}</td>
              <td>{{ u.testCount }}</td>
              <td>{{ u.currentLevel ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn ghost" @click="showUsers = false">关闭</button>
      </div>
    </div>

    <!-- 测试次数明细 -->
    <div v-if="showTests" class="modal">
      <div class="modal-card wide">
        <template v-if="!selectedUser">
          <h3>各用户测试次数</h3>
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>测试次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in userRows" :key="u.id">
                <td>{{ u.username }}</td>
                <td>{{ u.testCount }}</td>
                <td>
                  <button class="mini" :disabled="u.testCount === 0" @click="viewTimes(u)">查看测试时间</button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
        <template v-else>
          <h3>{{ selectedUser.username }} 的测试记录</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>类型</th>
                <th>等级</th>
                <th>完成时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in userTests" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ typeLabel(t.type) }}</td>
                <td>{{ t.finalLevel ?? "-" }}</td>
                <td>{{ formatTime(t.finishedTime) }}</td>
              </tr>
            </tbody>
          </table>
          <button class="btn ghost" @click="selectedUser = null">返回</button>
        </template>
        <button class="btn ghost" @click="closeTests">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";

const stats = ref<any>(null);
const userRows = ref<any[]>([]);
const showUsers = ref(false);
const showTests = ref(false);
const selectedUser = ref<any>(null);
const userTests = ref<any[]>([]);

function barWidth(count: number) {
  const max = Math.max(...stats.value.levelDistribution.map((d: any) => d.count), 1);
  return Math.round((count / max) * 100);
}

function typeLabel(type: string) {
  const map: Record<string, string> = { ADAPTIVE: "自适应", VERIFICATION: "验证", WRONG_WORD: "错词再测" };
  return map[type] ?? type;
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString("zh-CN") : "-";
}

async function openUsers() {
  const res = await adminApi.users({ page: 1, pageSize: 50 });
  userRows.value = res.list;
  showUsers.value = true;
}

async function openTests() {
  const res = await adminApi.users({ page: 1, pageSize: 50 });
  userRows.value = res.list;
  selectedUser.value = null;
  showTests.value = true;
}

async function viewTimes(u: any) {
  selectedUser.value = u;
  const detail = await adminApi.userDetail(u.id);
  userTests.value = detail.recentTests;
}

function closeTests() {
  showTests.value = false;
  selectedUser.value = null;
}

onMounted(async () => {
  stats.value = await adminApi.stats();
});
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: none;
  font: inherit;
  color: inherit;
}
.stat.clickable {
  cursor: pointer;
}
.stat.clickable:hover {
  border: 2px solid #409eff;
  padding: 18px;
}
.stat b {
  display: block;
  font-size: 26px;
}
.stat span {
  color: #9ca3af;
  font-size: 13px;
}
.dist {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}
.name {
  width: 56px;
  font-weight: 600;
}
.bar {
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #409eff;
}
.count {
  width: 48px;
  text-align: right;
  color: #6b7280;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 560px;
  max-height: 80vh;
  overflow: auto;
}
.modal-card.wide {
  max-width: 720px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}
th,
td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}
th {
  background: #f9fafb;
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
  margin-right: 8px;
}
.mini {
  padding: 4px 10px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
}
.mini:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

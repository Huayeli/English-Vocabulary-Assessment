<template>
  <div class="page">
    <header class="topbar">
      <h2>套餐中心</h2>
      <router-link to="/">返回测试中心</router-link>
    </header>

    <div v-if="current" class="current">
      当前套餐：<b>{{ current.name }}</b>
      <span v-if="current.expireTime"> · 有效期至 {{ formatDate(current.expireTime) }}</span>
      <span v-else-if="current.code === 'SINGLE'"> · 剩余次数 {{ current.remainingTestCount }}</span>
      <span v-else> · 无限测试</span>
    </div>

    <div class="cards">
      <div v-for="p in plans" :key="p.code" class="card" :class="{ active: p.code === current?.code }">
        <h3>{{ p.name }}</h3>
        <ul>
          <li v-for="f in features(p)" :key="f">{{ f }}</li>
        </ul>
        <button class="btn" :disabled="p.code === current?.code" @click="buy(p)">购买</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { http } from "../../api/http";
import { userApi } from "../../api/user";
import { useUiStore } from "../../stores/ui";

const ui = useUiStore();
const plans = ref<any[]>([]);
const current = ref<{
  code: string;
  name: string;
  expireTime: string | null;
  remainingTestCount: number;
} | null>(null);

function features(p: any): string[] {
  const list: string[] = [];
  if (p.dailyTestLimit != null) list.push(`每日 ${p.dailyTestLimit} 次测试`);
  else list.push("不限次数测试");
  list.push(p.reportLevel === "FULL" ? "详细测试报告" : "基础测试报告");
  if (p.verificationEnabled) list.push("等级验证测试");
  if (p.wrongBookEnabled) list.push("错词本与错词再测");
  if (p.historyEnabled) list.push("历史测试记录");
  return list;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN");
}

function buy(p: any) {
  ui.error(`“${p.name}”支付功能暂未开放，请联系管理员在后台开通`);
}

onMounted(async () => {
  const res = await http.get<{ list: any[] }>("/plans");
  plans.value = res.list;
  const my = (await userApi.myPlan()) as any;
  current.value = {
    code: my.packageCode,
    name: my.packageName,
    expireTime: my.packageExpireTime ?? null,
    remainingTestCount: my.remainingTestCount
  };
});
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}
.current {
  margin: 16px 0;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 8px;
  color: #31708f;
}
.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.card {
  background: #fff;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.card.active {
  border-color: #409eff;
}
.card h3 {
  margin: 0 0 12px;
}
.card ul {
  margin: 0 0 16px;
  padding-left: 20px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.9;
}
.btn {
  padding: 9px 24px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 640px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>

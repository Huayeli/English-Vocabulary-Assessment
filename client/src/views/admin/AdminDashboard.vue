<template>
  <div>
    <h2>全局统计</h2>
    <div v-if="stats" class="stats">
      <div class="stat"><b>{{ stats.codeCount }}</b><span>激活码总数</span></div>
      <div class="stat"><b>{{ stats.activeCodeCount }}</b><span>启用中</span></div>
      <div class="stat"><b>{{ stats.batchCount }}</b><span>批次</span></div>
      <div class="stat"><b>{{ stats.testCount }}</b><span>测试总数</span></div>
      <div class="stat"><b>{{ stats.todayTests }}</b><span>今日测试</span></div>
      <div class="stat"><b>{{ stats.averageVocabulary }}</b><span>平均词汇量</span></div>
    </div>
    <h3>等级分布</h3>
    <div v-if="stats" class="dist card">
      <div v-for="d in stats.levelDistribution" :key="d.level" class="row">
        <span class="name">{{ d.level }}</span>
        <div class="bar"><div class="fill" :style="{ width: `${barWidth(d.count)}%` }"></div></div>
        <span class="count">{{ d.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";

const stats = ref<any>(null);

function barWidth(count: number) {
  const max = Math.max(...stats.value.levelDistribution.map((d: any) => d.count), 1);
  return Math.round((count / max) * 100);
}

onMounted(async () => {
  stats.value = await adminApi.dashboard();
});
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.stat {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}
.stat b {
  display: block;
  font-size: 28px;
  color: #1e3a8a;
}
.stat span {
  color: #9ca3af;
  font-size: 13px;
}
.dist {
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
  background: linear-gradient(90deg, #2563eb, #3b82f6);
}
.count {
  width: 48px;
  text-align: right;
  color: #6b7280;
}
</style>

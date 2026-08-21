<template>
  <div>
    <h2 class="page-title">全局统计</h2>
    <div v-if="stats" class="stats">
      <div v-for="s in statCards" :key="s.label" class="stat" :style="cardStyle(s)">
        <span class="icon" :style="iconStyle(s)"><LineIcon :name="s.icon" :size="22" /></span>
        <b>{{ stats[s.key] }}</b>
        <span>{{ s.label }}</span>
      </div>
    </div>
    <h3 class="section-title">等级分布</h3>
    <div v-if="stats" class="dist card">
      <div v-for="d in stats.levelDistribution" :key="d.level" class="row">
        <span class="name" :style="{ background: LEVEL_COLORS[d.level] ?? '#4E3282' }">{{ d.level }}</span>
        <div class="bar">
          <div class="fill" :style="{ width: `${barWidth(d.count)}%`, background: `linear-gradient(90deg, ${LEVEL_COLORS[d.level] ?? '#4E3282'}, ${(LEVEL_COLORS[d.level] ?? '#4E3282')}99)` }"></div>
        </div>
        <span class="count">{{ d.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { adminApi } from "../../api/admin";
import LineIcon from "../../components/LineIcon.vue";

const stats = ref<any>(null);

const LEVEL_COLORS: Record<string, string> = {
  "1K": "#8E6CBB",
  "2K": "#4CBFA6",
  "3K": "#5B8FF9",
  "4K": "#F5A623",
  "5K": "#D97AB0",
  "6K": "#B69CD2",
  "7K": "#A2CDF3",
  "8K": "#C9A7E8",
  "9K": "#F8C7CE",
  "10K": "#F1A9BE",
  "10K+": "#E59BB4"
};

const statCards = [
  { key: "codeCount", label: "激活码总数", icon: "code", color: "#4E3282" },
  { key: "activeCodeCount", label: "启用中", icon: "check", color: "#8E6CBB" },
  { key: "batchCount", label: "批次", icon: "db", color: "#A2CDF3" },
  { key: "testCount", label: "测试总数", icon: "chart", color: "#F8C7CE" },
  { key: "todayTests", label: "今日测试", icon: "clock", color: "#F1A9BE" },
  { key: "averageVocabulary", label: "平均词汇量", icon: "trophy", color: "#8E6CBB" }
];

function cardStyle(s: any) {
  return { borderTopColor: s.color, borderTopWidth: "10px" };
}

function iconStyle(s: any) {
  return {
    color: "#fff",
    background: s.color,
    border: "3px solid #000",
    boxShadow: "2px 2px 0 0 #000"
  };
}

function barWidth(count: number) {
  const max = Math.max(...stats.value.levelDistribution.map((d: any) => d.count), 1);
  return Math.round((count / max) * 100);
}

onMounted(async () => {
  stats.value = await adminApi.dashboard();
});
</script>

<style scoped>
.page-title {
  margin: 0 0 20px;
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 1px;
}
.section-title {
  margin: 26px 0 12px;
  font-family: var(--font-display);
  color: var(--primary-dark);
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.stat {
  background: var(--card);
  border: 3px solid #000;
  border-radius: 0;
  padding: 20px;
  text-align: center;
  box-shadow: 5px 5px 0 0 #000;
  transition: transform 0.15s linear, box-shadow 0.15s linear;
}
.stat:hover {
  transform: translate(-3px, -3px);
  box-shadow: 7px 7px 0 0 #000;
}
.icon {
  width: 44px;
  height: 44px;
  border-radius: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.stat b {
  display: block;
  font-size: 28px;
  font-family: var(--font-display);
  font-weight: 900;
  color: #000;
}
.stat span {
  color: #000;
  font-size: 13px;
  font-weight: 700;
}
.dist {
  padding: 22px;
  border-radius: 22px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}
.name {
  width: 58px;
  text-align: center;
  color: #fff;
  border: 2px solid #000;
  border-radius: 0;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 900;
  font-family: var(--font-display);
  box-shadow: 2px 2px 0 0 #000;
}
.bar {
  flex: 1;
  height: 12px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 0;
  transition: width 0.2s linear;
}
.count {
  width: 48px;
  text-align: right;
  color: #000;
  font-weight: 900;
}
</style>

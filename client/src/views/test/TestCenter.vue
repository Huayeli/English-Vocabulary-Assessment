<template>
  <div class="page">
    <DecoCircles />
    <CodeHeader />
    <div class="content">
      <h1 class="title">选择测试方式</h1>
      <div class="main-cards">
        <router-link class="card main-card" to="/test/adaptive">
          <div class="icon-dot"><LineIcon name="gauge" :size="30" /></div>
          <h3>自适应测试</h3>
          <p>30 题动态调整等级，测出你的真实词汇量</p>
          <button class="btn-green">开始测试</button>
        </router-link>
        <router-link class="card main-card" to="/test/verification">
          <div class="icon-dot"><LineIcon name="target" :size="30" /></div>
          <h3>等级验证</h3>
          <p>选择目标等级，30 题正确率达到 80% 即判定达标</p>
          <button class="btn-green">开始验证</button>
        </router-link>
      </div>

      <div class="mini-grid">
        <div class="mini"><LineIcon name="list" :size="18" /><span>30 题自适应测评</span></div>
        <div class="mini"><LineIcon name="check" :size="18" /><span>80% 达标判定</span></div>
        <div class="mini"><LineIcon name="report" :size="18" /><span>详细词汇量报告</span></div>
        <div class="mini"><LineIcon name="shield" :size="18" /><span>防作弊可信度检测</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useCodeStore } from "../../stores/code";
import CodeHeader from "../../components/CodeHeader.vue";
import DecoCircles from "../../components/DecoCircles.vue";
import LineIcon from "../../components/LineIcon.vue";

const store = useCodeStore();

onMounted(() => {
  store.refreshInfo();
});
</script>

<style scoped>
.page {
  position: relative;
  max-width: 920px;
  margin: 0 auto;
  padding: 26px 28px;
}
.content {
  position: relative;
  z-index: 1;
  text-align: center;
}
.title {
  margin: 44px 0 34px;
  font-size: 34px;
  letter-spacing: 4px;
  color: var(--ink);
}
.main-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.main-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px 34px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.main-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 44px rgba(74, 98, 79, 0.16);
}
.icon-dot {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 1.5px solid rgba(95, 122, 99, 0.35);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.main-card h3 {
  margin: 0 0 8px;
  font-size: 21px;
  color: var(--ink);
}
.main-card p {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
}
.mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 24px;
}
.mini {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--card);
  border-radius: 16px;
  padding: 16px 10px;
  box-shadow: var(--shadow-sm);
  font-size: 13px;
  color: var(--muted);
}
.mini .dot {
  color: var(--primary);
}
@media (max-width: 760px) {
  .main-cards,
  .mini-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

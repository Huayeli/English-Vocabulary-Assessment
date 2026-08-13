<template>
  <div class="page">
    <CodeHeader />
    <div class="hero">
      <h1>选择测试方式</h1>
      <p v-if="store.info">
        已使用 <b>{{ store.info.usedCount }}</b> 次
        <template v-if="store.info.remaining !== null">，剩余 <b>{{ store.info.remaining }}</b> 次</template>
        <template v-else>，不限次数</template>
      </p>
    </div>
    <div class="cards">
      <router-link class="card entry" to="/test/adaptive">
        <h3>自适应测试</h3>
        <p>30 题动态调整等级，测出你的词汇量</p>
        <span class="go">开始 →</span>
      </router-link>
      <router-link class="card entry" to="/test/verification">
        <h3>等级验证</h3>
        <p>选择等级，30 题正确率 80% 判定达标</p>
        <span class="go">开始 →</span>
      </router-link>
      <router-link class="card entry" to="/test/wrong">
        <h3>错词再测</h3>
        <p>针对错词本重新测试，巩固记忆</p>
        <span class="go">开始 →</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useCodeStore } from "../../stores/code";
import CodeHeader from "../../components/CodeHeader.vue";

const store = useCodeStore();

onMounted(() => {
  store.refreshInfo();
});
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
}
.hero {
  text-align: center;
  margin: 30px 0 30px;
}
.hero h1 {
  font-size: 30px;
  color: #1e3a8a;
  margin: 0 0 8px;
}
.hero p {
  color: #6b7280;
}
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card.entry {
  padding: 26px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.card.entry:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.18);
}
.card.entry h3 {
  margin: 0 0 8px;
  color: #1e3a8a;
}
.card.entry p {
  color: #6b7280;
  font-size: 14px;
  min-height: 42px;
}
.go {
  color: #2563eb;
  font-weight: 600;
}
@media (max-width: 720px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>

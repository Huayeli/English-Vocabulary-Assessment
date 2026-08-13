<template>
  <div class="page">
    <CodeHeader />
    <header class="topbar">
      <h2>错词本</h2>
      <div class="nav">
        <router-link to="/">测试中心</router-link>
        <router-link to="/test/wrong" class="btn">错词再测</router-link>
      </div>
    </header>

    <p v-if="!items.length" class="empty">暂无错词，继续加油！</p>
    <div v-else class="list">
      <div v-for="w in items" :key="w.id" class="item">
        <div class="main">
          <b>{{ w.headword }}</b>
          <span class="level">{{ w.level }}</span>
          <span class="meaning">{{ w.correctMeaning }}</span>
        </div>
        <div class="side">
          <span class="count">错 {{ w.errorCount }} 次</span>
          <button class="mini" @click="onReview(w.id)">已掌握</button>
          <button class="mini danger" @click="onRemove(w.id)">移除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { wrongWordsApi, type WrongWordItem } from "../../api/wrongWords";
import CodeHeader from "../../components/CodeHeader.vue";

const items = ref<WrongWordItem[]>([]);

async function load() {
  const res = await wrongWordsApi.list(1);
  items.value = res.list;
}

async function onReview(id: number) {
  await wrongWordsApi.review(id);
  await load();
}

async function onRemove(id: number) {
  await wrongWordsApi.remove(id);
  await load();
}

onMounted(load);
</script>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav {
  display: flex;
  gap: 12px;
  align-items: center;
}
.nav a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}
.nav .btn {
  background: #409eff;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
}
.empty {
  text-align: center;
  color: #9ca3af;
  padding: 60px 0;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.main b {
  font-size: 18px;
}
.level {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}
.meaning {
  color: #6b7280;
  font-size: 14px;
}
.side {
  display: flex;
  align-items: center;
  gap: 8px;
}
.count {
  color: #f59e0b;
  font-size: 13px;
}
.mini {
  padding: 6px 12px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
}
.mini.danger {
  border-color: #f87171;
  color: #dc2626;
}
</style>

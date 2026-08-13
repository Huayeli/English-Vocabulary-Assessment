<template>
  <div class="page">
    <UserHeader />
    <div v-if="report" class="card">
      <h1>{{ report.passed === true ? "验证通过" : "测试完成" }}</h1>
      <div class="big">
        <div class="big-item">
          <span class="num">{{ report.finalLevel ?? "-" }}</span>
          <span class="label">当前等级</span>
        </div>
        <div class="big-item">
          <span class="num">{{ report.estimatedVocabulary ?? "-" }}</span>
          <span class="label">预计词汇量</span>
        </div>
        <div class="big-item">
          <span class="num">{{ Math.round((report.accuracy ?? 0) * 100) }}%</span>
          <span class="label">正确率</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn" @click="$router.push(`/report/${report.sessionId}`)">查看详细报告</button>
        <router-link class="btn ghost" to="/">返回测试中心</router-link>
      </div>
    </div>
    <div v-else-if="error" class="card error-card">
      <p class="error">报告加载失败：{{ error }}</p>
      <div class="actions">
        <button class="btn" @click="load">重试</button>
        <router-link class="btn ghost" to="/">返回测试中心</router-link>
      </div>
    </div>
    <div v-else class="loading">加载中…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { reportApi, type Report } from "../../api/report";
import { useTestStore } from "../../stores/test";
import UserHeader from "../../components/UserHeader.vue";

const route = useRoute();
const test = useTestStore();
const report = ref<Report | null>(null);
const error = ref("");

const sessionId = computed(() => Number(route.params.sessionId) || test.sessionId || 0);

async function load() {
  error.value = "";
  report.value = null;
  try {
    report.value = await reportApi.detail(sessionId.value);
  } catch (e) {
    error.value = (e as Error).message ?? "未知错误";
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 24px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
h1 {
  margin-bottom: 24px;
}
.big {
  display: flex;
  justify-content: space-around;
  margin: 24px 0;
}
.big-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.num {
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
}
.label {
  color: #9ca3af;
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}
.btn.ghost {
  background: #fff;
  color: #409eff;
  border: 1px solid #409eff;
}
.loading {
  text-align: center;
  color: #6b7280;
  padding: 60px 0;
}
.error {
  color: #dc2626;
}
</style>

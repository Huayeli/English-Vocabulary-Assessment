<template>
  <div class="page">
    <CodeHeader />
    <div v-if="report" class="card">
      <div class="head">
        <h1>测试报告</h1>
        <span class="type">{{ typeLabel }}</span>
        <span v-if="report.passed !== null" class="passed" :class="report.passed ? 'ok' : 'bad'">
          {{ report.passed ? "达标" : "未达标" }}
        </span>
      </div>

      <div class="meta">
        <div class="meta-item"><span>测试时间</span><b>{{ formatTime(report.testTime) }}</b></div>
        <div class="meta-item"><span>完成时间</span><b>{{ report.finishedTime ? formatTime(report.finishedTime) : "-" }}</b></div>
        <div class="meta-item"><span>测试题数</span><b>{{ report.totalQuestions }}</b></div>
        <div class="meta-item"><span>正确率</span><b>{{ Math.round((report.accuracy ?? 0) * 100) }}%</b></div>
        <div class="meta-item"><span>当前等级</span><b>{{ report.finalLevel ?? "-" }}</b></div>
        <div class="meta-item"><span>预计词汇量</span><b>{{ report.estimatedVocabulary ?? "-" }}</b></div>
        <div class="meta-item"><span>CEFR 参考</span><b>{{ report.cefr ?? "-" }}</b></div>
      </div>

      <h2>各等级掌握情况</h2>
      <div v-if="report.levelMastery.length" class="mastery">
        <RateBar
          v-for="m in report.levelMastery"
          :key="m.level"
          :level="m.level"
          :rate="m.rate"
          :answered="m.answered"
          :correct="m.correct"
        />
      </div>
      <p v-else class="empty">暂无数据</p>

      <div class="actions">
        <router-link class="btn" to="/">返回测试中心</router-link>
      </div>
    </div>
    <div v-else-if="error" class="card">
      <p class="empty">报告加载失败：{{ error }}</p>
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
import RateBar from "../../components/RateBar.vue";
import CodeHeader from "../../components/CodeHeader.vue";

const route = useRoute();
const report = ref<Report | null>(null);
const error = ref("");

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    ADAPTIVE: "自适应测试",
    VERIFICATION: "等级验证"
  };
  return map[report.value?.type ?? ""] ?? report.value?.type ?? "";
});

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

async function load() {
  error.value = "";
  report.value = null;
  try {
    report.value = await reportApi.detail(Number(route.params.sessionId));
  } catch (e) {
    error.value = (e as Error).message ?? "未知错误";
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.type {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
}
.passed {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
}
.passed.ok {
  background: #ecfdf5;
  color: #059669;
}
.passed.bad {
  background: #fef2f2;
  color: #dc2626;
}
.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}
.meta-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-item span {
  color: #9ca3af;
  font-size: 12px;
}
h2 {
  margin: 24px 0 12px;
  font-size: 16px;
}
.wrong-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}
.wrong-item span {
  color: #6b7280;
}
.empty {
  color: #9ca3af;
  font-size: 14px;
}
.actions {
  margin-top: 24px;
}
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  border: none;
  cursor: pointer;
}
.btn.ghost {
  background: #fff;
  color: #409eff;
  border: 1px solid #409eff;
}
</style>

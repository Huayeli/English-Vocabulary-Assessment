<template>
  <div class="page">
    <CodeHeader />
    <div v-if="report" class="card">
      <div class="medal" :class="report.passed === true ? 'pass' : 'done'">
        <LineIcon :name="report.passed === true ? 'award' : 'check'" :size="34" />
      </div>
      <h1>{{ report.passed === true ? "验证通过" : "测试完成" }}</h1>
      <p class="sub">本次测试成绩单</p>
      <div class="big">
        <div class="big-item">
          <span class="num" style="color: #4E3282">{{ report.finalLevel ?? "-" }}</span>
          <span class="label">当前等级</span>
        </div>
        <div class="big-item">
          <span class="num" style="color: #F1A9BE">{{ report.estimatedVocabulary ?? "-" }}</span>
          <span class="label">预计词汇量</span>
        </div>
        <div class="big-item">
          <span class="num" style="color: #8E6CBB">{{ Math.round((report.accuracy ?? 0) * 100) }}%</span>
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
import CodeHeader from "../../components/CodeHeader.vue";
import LineIcon from "../../components/LineIcon.vue";

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
  border-radius: 28px;
  padding: 36px;
  text-align: center;
  box-shadow: var(--shadow);
  border: 1px solid rgba(78, 50, 130, 0.06);
}
.medal {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 26px rgba(78, 50, 130, 0.3);
}
.medal.pass {
  background: linear-gradient(135deg, #F8C7CE, #F1A9BE);
  box-shadow: 0 10px 26px rgba(248, 199, 206, 0.35);
}
.medal.done {
  background: linear-gradient(135deg, #4E3282, #8E6CBB);
}
h1 {
  margin: 0 0 4px;
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 2px;
}
.sub {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 14px;
}
.big {
  display: flex;
  justify-content: space-around;
  margin: 26px 0;
  background: linear-gradient(135deg, #F3EDF9, #F3EDF9);
  border-radius: 20px;
  padding: 22px 10px;
}
.big-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.num {
  font-size: 34px;
  font-weight: 800;
  font-family: var(--font-display);
}
.label {
  color: var(--muted);
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
.btn {
  padding: 12px 26px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #4E3282, #8E6CBB);
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(78, 50, 130, 0.25);
  transition: transform 0.15s;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn.ghost {
  background: #fff;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  box-shadow: none;
}
.loading {
  text-align: center;
  color: var(--muted);
  padding: 60px 0;
}
.error {
  color: var(--danger);
}
</style>

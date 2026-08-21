<template>
  <div class="page">
    <DecoCircles />
    <CodeHeader />
    <div v-if="report" class="card">
      <div class="head">
        <h1>测试报告</h1>
        <span class="type">{{ typeLabel }}</span>
        <span v-if="report.passed !== null" class="passed" :class="report.passed ? 'ok' : 'bad'">
          {{ report.passed ? "达标" : "未达标" }}
        </span>
      </div>

      <div v-if="report.invalid || (report.reliability !== null && report.reliability < 40)" class="warn bad">
        本次结果疑似无效（可信度低），仅供参考。
      </div>
      <div v-else-if="report.reliability !== null && report.reliability < 60" class="warn mid">
        本次结果可信度较低（{{ report.reliability }} 分），仅供参考，未计入后台平均词汇量统计。
      </div>
      <div v-if="report.flags" class="warn flags">
        检测标记：{{ report.flags }}
      </div>

      <div class="meta">
        <div class="meta-item"><span>测试时间</span><b>{{ formatTime(report.testTime) }}</b></div>
        <div class="meta-item"><span>完成时间</span><b>{{ report.finishedTime ? formatTime(report.finishedTime) : "-" }}</b></div>
        <div class="meta-item"><span>测试题数</span><b>{{ report.totalQuestions }}</b></div>
        <div class="meta-item"><span>正确率</span><b>{{ Math.round((report.accuracy ?? 0) * 100) }}%</b></div>
        <div class="meta-item"><span>当前等级</span><b>{{ report.finalLevel ?? "-" }}</b></div>
        <div class="meta-item"><span>预计词汇量</span><b>{{ report.estimatedVocabulary ?? "-" }}</b></div>
        <div class="meta-item"><span>CEFR 参考</span><b>{{ report.cefr ?? "-" }}</b></div>
        <div class="meta-item"><span>结果可信度</span><b>{{ report.reliability ?? "-" }}</b></div>
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

      <h2>错词与解析</h2>
      <div v-if="report.wrongWords.length" class="wrong">
        <div v-for="w in report.wrongWords" :key="w.wordId" class="wrong-item">
          <div class="wrong-head">
            <b>{{ w.headword }}</b>
            <span class="lv">{{ w.level }}</span>
          </div>
          <p class="line">你的答案：<span class="bad">{{ w.userAnswer }}</span></p>
          <p class="line">正确答案：<span class="ok">{{ w.correctAnswer }}</span></p>
          <p class="line">解析：<span>{{ w.explanation }}</span></p>
        </div>
      </div>
      <p v-else class="empty">全部答对，没有错词 🎉</p>

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
import DecoCircles from "../../components/DecoCircles.vue";

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
  background: var(--card);
  border-radius: 28px;
  padding: 30px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(78, 50, 130, 0.06);
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.card::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -80px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(162, 205, 243, 0.18), rgba(162, 205, 243, 0) 70%);
  pointer-events: none;
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
h1 {
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 2px;
}
.type {
  background: var(--primary-soft);
  color: var(--primary-dark);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.passed {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.passed.ok {
  background: #EDE6F7;
  color: #8E6CBB;
}
.passed.bad {
  background: #FCE9EE;
  color: var(--accent-red);
}
.warn {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  margin: 14px 0 0;
  position: relative;
}
.warn.bad {
  background: #FCE9EE;
  color: var(--accent-red);
}
.warn.mid {
  background: #FFF7E0;
  color: #F1A9BE;
}
.warn.flags {
  background: #EDE6F7;
  color: #4E3282;
}
.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
  position: relative;
}
.meta-item {
  background: #F3EDF9;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(78, 50, 130, 0.06);
  border-left: 4px solid var(--primary);
}
.meta-item span {
  color: var(--muted);
  font-size: 12px;
}
.meta-item b {
  font-family: var(--font-display);
  font-size: 15px;
}
h2 {
  margin: 26px 0 14px;
  font-size: 16px;
  font-family: var(--font-display);
  color: var(--primary-dark);
  position: relative;
}
.mastery {
  position: relative;
}
.wrong-item {
  padding: 16px;
  margin-bottom: 12px;
  background: #F3EDF9;
  border-radius: 16px;
  border: 1px solid rgba(78, 50, 130, 0.08);
  position: relative;
}
.wrong-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wrong-head b {
  font-size: 17px;
  font-family: var(--font-display);
  color: var(--ink);
}
.lv {
  background: var(--primary-soft);
  color: var(--primary-dark);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-display);
}
.line {
  margin: 4px 0;
  font-size: 14px;
  color: var(--ink);
}
.ok {
  color: #8E6CBB;
  font-weight: 600;
}
.bad {
  color: var(--accent-red);
  font-weight: 600;
}
.empty {
  color: var(--muted);
  font-size: 14px;
}
.actions {
  margin-top: 24px;
  position: relative;
}
.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4E3282, #8E6CBB);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  border: none;
  cursor: pointer;
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
</style>

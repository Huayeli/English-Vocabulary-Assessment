<template>
  <div class="runner">
    <DecoCircles />
    <div class="exit-bar">
      <button class="exit-btn" @click="confirmExit = true">退出测试</button>
    </div>

    <div v-if="!test.questions.length" class="loading">
      <span class="lds"><i></i><i></i><i></i></span>
      <p>测试加载中…</p>
    </div>
    <template v-else>
      <TestProgress :seq="test.seq" :total="test.totalQuestions" />
      <QuestionCard :question="current.q" :selected="current.selectedIndex" @select="onSelect" />
      <div class="nav-row">
        <button class="nav-btn" :disabled="test.seq === 1 || submitting" @click="test.prev()">上一题</button>
        <button class="nav-btn primary" :disabled="current.selectedIndex === null || submitting" @click="goNext">
          {{ rightLabel }}
        </button>
      </div>
    </template>

    <div v-if="confirmExit" class="overlay">
      <div class="dialog">
        <p>退出后本次测试记录不会保存，且不消耗测试次数。确定退出吗？</p>
        <div class="dialog-actions">
          <button class="btn ghost" @click="confirmExit = false">继续答题</button>
          <button class="btn danger" @click="doExit">退出测试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { onBeforeUnmount } from "vue";
import { useTestStore } from "../stores/test";
import { useUiStore } from "../stores/ui";
import { testApi } from "../api/test";
import QuestionCard from "./QuestionCard.vue";
import TestProgress from "./TestProgress.vue";
import DecoCircles from "./DecoCircles.vue";

const props = defineProps<{ mode: "adaptive" | "verification" }>();

const router = useRouter();
const test = useTestStore();
const ui = useUiStore();
const submitting = ref(false);
const confirmExit = ref(false);

const current = computed(() => test.questions[test.seq - 1]);
const isLast = computed(() => test.seq === test.questions.length);
const isReanswer = computed(() => current.value?.selectedIndex !== null);
const rightLabel = computed(() => {
  if (current.value?.selectedIndex !== null && isLast.value) return "提交完成";
  return "下一题";
});

async function onSelect(optionIndex: number) {
  if (submitting.value || !test.sessionId) return;
  submitting.value = true;
  try {
    const res = await test.answer(optionIndex, isReanswer.value ? test.seq : undefined);
    if (res.finished) {
      setTimeout(() => router.push(`/test/result/${test.sessionId}`), 600);
      return;
    }
    // 选择后自动进入下一题
    setTimeout(() => {
      test.next();
      submitting.value = false;
    }, 500);
  } catch (e) {
    ui.error((e as Error).message ?? "提交失败，请重试");
    submitting.value = false;
  }
}

function goNext() {
  if (current.value?.selectedIndex !== null && isLast.value) {
    router.push(`/test/result/${test.sessionId}`);
    return;
  }
  test.next();
}

async function doExit() {
  if (!test.sessionId) return;
  try {
    await testApi.abandon(test.sessionId);
  } catch {
    // 放弃失败也允许直接离开
  }
  test.reset();
  confirmExit.value = false;
  router.replace("/");
}

async function abandonQuietly() {
  if (!test.sessionId || test.finished) return;
  try {
    await testApi.abandon(test.sessionId);
  } catch {
    // 静默退出：失败时由后端陈旧会话机制兜底
  }
}

onBeforeRouteLeave(abandonQuietly);
onBeforeUnmount(abandonQuietly);
</script>

<style scoped>
.runner {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
  z-index: 1;
}
.exit-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.exit-btn {
  padding: 9px 20px;
  border: 2px solid #000;
  border-radius: 0;
  background: #fff;
  color: #FF6B6B;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
  transition: transform 0.1s linear, background 0.1s linear, box-shadow 0.1s linear;
}
.exit-btn:hover {
  background: #FFE9E9;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 #000;
}
.loading {
  text-align: center;
  color: #000;
  font-weight: 700;
  padding: 80px 0;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 5px 5px 0 0 #000;
}
.loading p {
  margin: 14px 0 0;
  font-size: 14px;
  letter-spacing: 2px;
}
.lds {
  display: inline-flex;
  gap: 8px;
}
.lds i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: bounce 1s ease-in-out infinite;
}
.lds i:nth-child(1) {
  background: #FF6B6B;
}
.lds i:nth-child(2) {
  background: #FFD93D;
  animation-delay: 0.15s;
}
.lds i:nth-child(3) {
  background: #C4B5FD;
  animation-delay: 0.3s;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
  gap: 12px;
}
.nav-btn {
  padding: 12px 34px;
  border: 2px solid #000;
  border-radius: 0;
  background: #fff;
  color: #000;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  font-family: var(--font-display);
  box-shadow: 2px 2px 0 0 #000;
  transition: transform 0.1s linear, background 0.1s linear, box-shadow 0.1s linear;
}
.nav-btn:not(:disabled):hover {
  background: #FFD93D;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 0 #000;
}
.nav-btn.primary {
  background: #FF6B6B;
  border-color: #000;
  color: #fff;
  box-shadow: 3px 3px 0 0 #000;
}
.nav-btn.primary:hover:not(:disabled) {
  background: #E85353;
  box-shadow: 4px 4px 0 0 #000;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  min-width: 340px;
  max-width: 420px;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 6px 6px 0 0 #000;
}
.dialog p {
  margin: 0 0 20px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  line-height: 1.7;
}
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn {
  padding: 9px 22px;
  border: 2px solid #000;
  border-radius: 0;
  background: #FF6B6B;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
  transition: transform 0.1s linear, box-shadow 0.1s linear;
}
.btn.ghost {
  background: #fff;
  color: #000;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
}
.btn.danger {
  background: #FF6B6B;
}
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
</style>

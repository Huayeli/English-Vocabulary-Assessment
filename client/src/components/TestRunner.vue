<template>
  <div class="runner">
    <DecoCircles />
    <div class="exit-bar">
      <button class="exit-btn" @click="confirmExit = true">退出测试</button>
    </div>

    <div v-if="!test.questions.length" class="loading">测试加载中…</div>
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
      <div class="modal">
        <p>退出后本次测试记录不会保存，且不消耗测试次数。确定退出吗？</p>
        <div class="modal-actions">
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
  padding: 9px 18px;
  border: 1.5px solid rgba(194, 107, 94, 0.6);
  border-radius: 12px;
  background: #fff;
  color: var(--danger);
  cursor: pointer;
  font-size: 14px;
}
.loading {
  text-align: center;
  color: #6b7280;
  padding: 60px 0;
}
.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
  gap: 12px;
}
.nav-btn {
  padding: 12px 30px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.nav-btn.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.nav-btn.primary:hover:not(:disabled) {
  background: var(--primary-dark);
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
.modal {
  min-width: 320px;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  text-align: center;
}
.modal p {
  margin: 0 0 20px;
  font-size: 15px;
  color: #374151;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn {
  padding: 9px 22px;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn.ghost {
  background: #fff;
  color: var(--primary);
  border: 1.5px solid var(--primary);
}
.btn.danger {
  background: var(--danger);
}
</style>

<template>
  <div class="runner">
    <div v-if="showExit" class="exit-bar">
      <button class="exit-btn" @click="confirmExit = true">退出测试</button>
    </div>

    <div v-if="!test.questions.length" class="loading">测试加载中…</div>
    <template v-else>
      <TestProgress :seq="test.seq" :total="test.totalQuestions" />
      <QuestionCard :question="current.q" :selected="current.selectedIndex" @select="onSelect" />
      <div class="nav-row">
        <button class="nav-btn" :disabled="test.seq === 1 || submitting" @click="test.prev()">上一题</button>
        <button
          v-if="mode === 'wrong' && answeredCount > 0 && !(isLast && current.selectedIndex !== null)"
          class="nav-btn result"
          :disabled="submitting"
          @click="viewResult"
        >
          查看结果
        </button>
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
import { useRouter } from "vue-router";
import { useTestStore } from "../stores/test";
import { useUiStore } from "../stores/ui";
import { testApi } from "../api/test";
import QuestionCard from "./QuestionCard.vue";
import TestProgress from "./TestProgress.vue";

const props = defineProps<{ mode: "adaptive" | "verification" | "wrong" }>();

const router = useRouter();
const test = useTestStore();
const ui = useUiStore();
const submitting = ref(false);
const confirmExit = ref(false);

const showExit = computed(() => props.mode === "wrong");
const current = computed(() => test.questions[test.seq - 1]);
const isLast = computed(() => test.seq === test.questions.length);
const isReanswer = computed(() => current.value?.selectedIndex !== null);
const answeredCount = computed(() => test.questions.filter((q) => q.selectedIndex !== null).length);
const rightLabel = computed(() => {
  if (current.value?.selectedIndex !== null && isLast.value) {
    return props.mode === "wrong" ? "查看结果" : "提交完成";
  }
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

async function viewResult() {
  if (!test.sessionId || submitting.value) return;
  submitting.value = true;
  try {
    const res = await testApi.finishEarly(test.sessionId);
    router.push(`/test/result/${(res as any).reportId ?? test.sessionId}`);
  } catch (e) {
    ui.error((e as Error).message ?? "查看结果失败");
    submitting.value = false;
  }
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
  router.replace("/wrong-words");
}
</script>

<style scoped>
.runner {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.exit-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.exit-btn {
  padding: 8px 16px;
  border: 1px solid #f87171;
  border-radius: 8px;
  background: #fff;
  color: #dc2626;
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
  padding: 10px 24px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
}
.nav-btn.primary {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
.nav-btn.result {
  border-color: #10b981;
  color: #059669;
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
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn.ghost {
  background: #fff;
  color: #409eff;
  border: 1px solid #409eff;
}
.btn.danger {
  background: #dc2626;
}
</style>

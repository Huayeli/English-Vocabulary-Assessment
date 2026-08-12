<template>
  <div class="runner">
    <div v-if="!test.questions.length" class="loading">测试加载中…</div>
    <template v-else>
      <TestProgress :seq="test.seq" :total="test.totalQuestions" />
      <QuestionCard :question="current.q" :selected="current.selectedIndex" @select="onSelect" />
      <div class="nav-row">
        <button class="nav-btn" :disabled="test.seq === 1 || submitting" @click="test.prev()">上一题</button>
        <button
          class="nav-btn primary"
          :disabled="current.selectedIndex === null || submitting"
          @click="goNext"
        >
          {{ test.seq === test.questions.length ? "查看结果" : "下一题" }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../stores/test";
import QuestionCard from "./QuestionCard.vue";
import TestProgress from "./TestProgress.vue";

const router = useRouter();
const test = useTestStore();
const submitting = ref(false);

const current = computed(() => test.questions[test.seq - 1]);

async function onSelect(optionIndex: number) {
  if (submitting.value || !test.sessionId) return;
  submitting.value = true;
  try {
    const res = await test.answer(optionIndex, test.seq);
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
    alert((e as Error).message ?? "提交失败，请重试");
    submitting.value = false;
  }
}

function goNext() {
  if (test.seq === test.questions.length) {
    router.push(`/test/result/${test.sessionId}`);
    return;
  }
  test.next();
}
</script>

<style scoped>
.runner {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.loading {
  text-align: center;
  color: #6b7280;
  padding: 60px 0;
}
.nav-row {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
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
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

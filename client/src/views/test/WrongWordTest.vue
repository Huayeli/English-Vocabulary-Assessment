<template>
  <div class="page">
    <div v-if="test.question && !test.finished">
      <TestProgress :seq="test.question.seq" :total="test.totalQuestions" :level="test.currentLevel" />
      <div v-if="feedback" class="feedback" :class="feedback.ok ? 'ok' : 'bad'">
        {{ feedback.text }}
      </div>
      <QuestionCard
        :question="test.question"
        :selected="test.lastResult?.selectedIndex ?? null"
        :correct-index="test.lastResult?.correctIndex ?? null"
        @select="onSelect"
      />
    </div>
    <div v-else class="loading">加载错词测试…</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";
import QuestionCard from "../../components/QuestionCard.vue";
import TestProgress from "../../components/TestProgress.vue";

const router = useRouter();
const test = useTestStore();
const locked = ref(false);
const feedback = ref<{ ok: boolean; text: string } | null>(null);

onMounted(async () => {
  if (!test.sessionId) {
    try {
      await test.start("wrong");
    } catch (e) {
      alert((e as Error).message ?? "启动失败");
      router.replace("/wrong-words");
    }
  }
});

async function onSelect(optionIndex: number) {
  if (locked.value || !test.sessionId) return;
  locked.value = true;
  const res = await test.answer(optionIndex);
  feedback.value = res.isCorrect
    ? { ok: true, text: "回答正确" }
    : { ok: false, text: `回答错误，正确答案是 ${test.question!.options[res.correctIndex]}` };
  if (res.finished) {
    setTimeout(() => router.push(`/test/result/${res.reportId}`), 1500);
    return;
  }
  setTimeout(() => {
    feedback.value = null;
    locked.value = false;
  }, 1800);
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.loading {
  text-align: center;
  color: #6b7280;
  padding: 60px 0;
}
.feedback {
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}
.feedback.ok {
  background: #ecfdf5;
  color: #059669;
}
.feedback.bad {
  background: #fef2f2;
  color: #dc2626;
}
</style>

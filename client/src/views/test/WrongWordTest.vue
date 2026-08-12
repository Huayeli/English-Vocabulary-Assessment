<template>
  <div class="page">
    <div v-if="test.question && !test.finished">
      <TestProgress :seq="test.question.seq" :total="test.totalQuestions" />
      <QuestionCard
        :question="test.question"
        :selected="test.lastResult?.selectedIndex ?? null"
        @select="onSelect"
      />
      <div v-if="answered" class="next-row">
        <button class="btn" @click="goNext">{{ test.finished ? "查看结果" : "下一题" }}</button>
      </div>
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
const answered = ref(false);

onMounted(async () => {
  if (test.finished) {
    test.reset();
  }
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
  try {
    await test.answer(optionIndex);
    answered.value = true;
  } catch (e) {
    alert((e as Error).message ?? "提交失败，请重试");
    locked.value = false;
  }
}

function goNext() {
  if (test.finished) {
    router.push(`/test/result/${test.sessionId}`);
    return;
  }
  answered.value = false;
  locked.value = false;
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
.next-row {
  margin-top: 16px;
  text-align: right;
}
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  font-size: 15px;
}
</style>

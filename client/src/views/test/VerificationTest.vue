<template>
  <div class="page">
    <div v-if="!started" class="level-picker">
      <h2>选择要验证的等级</h2>
      <div class="levels">
        <button v-for="lv in LEVELS" :key="lv" class="level" @click="choose(lv)">{{ lv }}</button>
      </div>
      <router-link class="back" to="/">返回测试中心</router-link>
    </div>

    <template v-else>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";
import QuestionCard from "../../components/QuestionCard.vue";
import TestProgress from "../../components/TestProgress.vue";

const LEVELS = ["1K", "2K", "3K", "5K", "10K", "10K+"];
const LEVEL_MAP: Record<string, string> = {
  "1K": "K1",
  "2K": "K2",
  "3K": "K3",
  "5K": "K5",
  "10K": "K10",
  "10K+": "K10P"
};

const router = useRouter();
const test = useTestStore();
const started = ref(false);
const locked = ref(false);
const answered = ref(false);

async function choose(level: string) {
  try {
    await test.start("verification", LEVEL_MAP[level]);
    started.value = true;
  } catch (e) {
    alert((e as Error).message ?? "启动失败");
  }
}

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
.level-picker {
  text-align: center;
}
.levels {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
}
.level {
  padding: 16px 28px;
  border: 2px solid #409eff;
  border-radius: 10px;
  background: #fff;
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.level:hover {
  background: #ecf5ff;
}
.back {
  display: block;
  color: #6b7280;
  font-size: 13px;
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

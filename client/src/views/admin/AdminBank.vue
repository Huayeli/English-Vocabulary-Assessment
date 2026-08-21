<template>
  <div>
    <h2 class="page-title">题库管理</h2>
    <div class="tabs">
      <button :class="{ active: tab === 'words' }" @click="tab = 'words'">单词与词义</button>
      <button :class="{ active: tab === 'questions' }" @click="tab = 'questions'">题目</button>
    </div>
    <AdminWords v-if="tab === 'words'" />
    <AdminQuestions v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AdminWords from "./AdminWords.vue";
import AdminQuestions from "./AdminQuestions.vue";

const tab = ref<"words" | "questions">("words");
</script>

<style scoped>
.page-title {
  margin: 0;
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 1px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 14px 0;
}
.tabs button {
  padding: 9px 20px;
  border: 1px solid #D8CDE8;
  border-radius: 999px;
  background: #fff;
  color: #57466B;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.tabs button.active {
  background: #4E3282;
  border-color: #4E3282;
  color: #fff;
  box-shadow: 0 6px 14px rgba(78, 50, 130, 0.25);
}
</style>

<template>
  <div>
    <h2>题库管理</h2>
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
.tabs {
  display: flex;
  gap: 8px;
  margin: 14px 0;
}
.tabs button {
  padding: 9px 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.tabs button.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
</style>

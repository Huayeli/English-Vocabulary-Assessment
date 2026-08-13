<template>
  <div class="q-card">
    <div class="q-word">{{ question.word }}</div>
    <div class="q-text">{{ question.question }}</div>
    <div class="options">
      <button
        v-for="(opt, i) in question.options"
        :key="i"
        class="option"
        :class="optionClass(i)"
        @click="$emit('select', i)"
      >
        <span class="index">{{ "ABCD"[i] }}</span>{{ opt }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TestQuestion } from "../api/test";

const props = defineProps<{
  question: TestQuestion;
  selected: number | null;
}>();

defineEmits<{ (e: "select", index: number): void }>();

function optionClass(i: number) {
  if (props.selected === null) return {};
  if (props.selected === i) return { selected: true };
  return { dim: true };
}
</script>

<style scoped>
.q-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.q-word {
  font-size: 34px;
  font-weight: 700;
  text-align: center;
  color: #1f2937;
}
.q-text {
  text-align: center;
  color: #6b7280;
  margin: 8px 0 24px;
}
.options {
  display: grid;
  gap: 10px;
}
.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 15px;
  cursor: pointer;
  text-align: left;
}
.option:not(:disabled):hover {
  border-color: #409eff;
  background: #ecf5ff;
}
.index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f3f4f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #4b5563;
}
.option.selected {
  border-color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
}
.option.selected .index {
  background: #409eff;
  color: #fff;
}
.option.dim {
  opacity: 0.6;
}
</style>

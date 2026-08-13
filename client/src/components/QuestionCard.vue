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
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 36px 34px 30px;
  box-shadow: var(--shadow);
}
.q-word {
  font-size: 38px;
  font-weight: 700;
  text-align: center;
  color: var(--ink);
  letter-spacing: 2px;
}
.q-text {
  text-align: center;
  color: var(--muted);
  margin: 10px 0 28px;
  font-size: 15px;
}
.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  background: #fff;
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.option:not(:disabled):hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.index {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--primary);
  font-weight: 700;
}
.option.selected {
  border-color: var(--primary);
  background: var(--primary-soft);
  font-weight: 600;
}
.option.selected .index {
  background: var(--primary);
  color: #fff;
}
.option.dim {
  opacity: 0.6;
}
</style>

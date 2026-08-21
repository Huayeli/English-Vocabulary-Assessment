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
  border: 3px solid #000;
  border-radius: 0;
  padding: 38px 36px 32px;
  box-shadow: 6px 6px 0 0 #000;
  position: relative;
  overflow: hidden;
}
.q-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.12) 1.5px, transparent 1.5px);
  background-size: 14px 14px;
  border-left: 2px solid #000;
  border-bottom: 2px solid #000;
  pointer-events: none;
}
.q-word {
  font-size: 46px;
  font-weight: 800;
  font-family: "Times New Roman", Times, serif;
  text-align: center;
  color: var(--ink);
  letter-spacing: 1px;
  position: relative;
}
.q-text {
  text-align: center;
  color: #000;
  font-weight: 700;
  margin: 12px 0 30px;
  font-size: 15px;
  position: relative;
}
.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  position: relative;
}
.option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 20px;
  border: 2px solid #000;
  border-radius: 0;
  background: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s linear, box-shadow 0.1s linear, background 0.1s linear;
  box-shadow: 2px 2px 0 0 #000;
}
.option:not(:disabled):hover {
  background: #FFF3F3;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 0 #000;
}
.index {
  width: 34px;
  height: 34px;
  border-radius: 0;
  border: 2px solid #000;
  background: #C4B5FD;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #000;
  font-weight: 900;
  font-family: var(--font-display);
  flex-shrink: 0;
}
.option.selected {
  background: #FFD93D;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
}
.option.selected .index {
  background: #FF6B6B;
  color: #fff;
  box-shadow: 2px 2px 0 0 #000;
}
.option.dim {
  opacity: 0.55;
}
</style>

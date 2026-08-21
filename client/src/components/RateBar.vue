<template>
  <div class="rate-row">
    <span class="lv" :style="lvStyle">{{ level }}</span>
    <div class="bar">
      <div class="fill" :style="{ width: `${Math.round(rate * 100)}%`, background: fillGradient }"></div>
    </div>
    <span class="value">{{ Math.round(rate * 100) }}%</span>
    <span class="detail">{{ correct }}/{{ answered }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ level: string; rate: number; answered: number; correct: number }>();

const LEVEL_COLORS: Record<string, string> = {
  "1K": "#8E6CBB",
  "2K": "#4CBFA6",
  "3K": "#5B8FF9",
  "4K": "#F5A623",
  "5K": "#D97AB0",
  "6K": "#B69CD2",
  "7K": "#A2CDF3",
  "8K": "#C9A7E8",
  "9K": "#F8C7CE",
  "10K": "#F1A9BE",
  "10K+": "#E59BB4"
};

const color = computed(() => LEVEL_COLORS[props.level] ?? "#4E3282");
const lvStyle = computed(() => ({ background: color.value }));
const fillGradient = computed(
  () => `linear-gradient(90deg, ${color.value}, ${color.value}99)`
);
</script>

<style scoped>
.rate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
.lv {
  width: 58px;
  text-align: center;
  color: #fff;
  border: 2px solid #000;
  border-radius: 0;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 900;
  font-family: var(--font-display);
  box-shadow: 2px 2px 0 0 #000;
}
.bar {
  flex: 1;
  height: 12px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 0;
  transition: width 0.2s linear;
}
.value {
  width: 48px;
  text-align: right;
  font-weight: 900;
  font-family: var(--font-display);
}
.detail {
  width: 64px;
  color: #000;
  font-size: 12px;
  font-weight: 700;
}
</style>

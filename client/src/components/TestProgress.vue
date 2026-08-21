<template>
  <div class="progress-wrap">
    <div class="bar">
      <div class="fill" :style="{ width: `${pct}%` }">
        <span class="dot"></span>
      </div>
    </div>
    <span class="label">第 {{ seq }} / {{ total }} 题</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ seq: number; total: number }>();
const pct = computed(() => Math.min(100, Math.round((props.seq / props.total) * 100)));
</script>

<style scoped>
.progress-wrap {
  margin: 16px 0;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0;
  padding: 10px 14px;
  box-shadow: 3px 3px 0 0 #000;
}
.bar {
  height: 18px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0;
  overflow: hidden;
  position: relative;
}
.fill {
  height: 100%;
  background: repeating-linear-gradient(90deg, #FF6B6B 0 22px, #FFD93D 22px 44px);
  transition: width 0.2s linear;
  border-radius: 0;
  position: relative;
  min-width: 0;
}
.dot {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 0;
  background: #000;
}
.label {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 900;
  color: #000;
  text-align: right;
}
</style>

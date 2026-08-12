<template>
  <div class="progress-wrap">
    <div class="bar">
      <div class="fill" :style="{ width: `${pct}%` }"></div>
    </div>
    <span class="label">第 {{ seq }} / {{ total }} 题 · 当前等级 {{ level }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ seq: number; total: number; level: string }>();
const pct = computed(() => Math.min(100, Math.round((props.seq / props.total) * 100)));
</script>

<style scoped>
.progress-wrap {
  margin: 16px 0;
}
.bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s;
}
.label {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}
</style>

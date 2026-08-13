<template>
  <div class="progress-wrap">
    <div class="bar">
      <div class="fill" :style="{ width: `${pct}%` }"></div>
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
}
.bar {
  height: 10px;
  background: rgba(95, 122, 99, 0.12);
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
  border-radius: 6px;
}
.label {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}
</style>

<template>
  <div class="rate-row">
    <span class="name">{{ level }}</span>
    <div class="bar">
      <div class="fill" :style="{ width: `${Math.round(rate * 100)}%` }"></div>
    </div>
    <span class="value">{{ Math.round(rate * 100) }}%</span>
    <span class="detail">{{ correct }}/{{ answered }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ level: string; rate: number; answered: number; correct: number }>();
</script>

<style scoped>
.rate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
.name {
  width: 56px;
  font-weight: 600;
}
.bar {
  flex: 1;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: #409eff;
  border-radius: 5px;
}
.value {
  width: 44px;
  text-align: right;
  font-weight: 600;
}
.detail {
  width: 64px;
  color: #9ca3af;
  font-size: 12px;
}
</style>

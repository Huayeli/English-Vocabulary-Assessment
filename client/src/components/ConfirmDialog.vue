<template>
  <div class="overlay">
    <div class="dialog">
      <p>{{ message }}</p>
      <div class="actions">
        <button class="btn-ghost" @click="$emit('cancel')">返回</button>
        <button class="btn-green" @click="$emit('confirm')">放弃并重新开始</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
defineEmits<{ (e: "confirm"): void; (e: "cancel"): void }>();
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(51, 59, 53, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  width: 380px;
  max-width: 90vw;
  background: #fff;
  border-radius: 24px;
  padding: 30px 26px;
  text-align: center;
  box-shadow: var(--shadow);
}
.dialog p {
  margin: 0 0 22px;
  font-size: 15px;
  color: var(--ink);
  line-height: 1.6;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>

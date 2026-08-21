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
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  width: 380px;
  max-width: 90vw;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 30px 26px;
  text-align: center;
  box-shadow: 6px 6px 0 0 #000;
}
.dialog p {
  margin: 0 0 22px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  line-height: 1.6;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>

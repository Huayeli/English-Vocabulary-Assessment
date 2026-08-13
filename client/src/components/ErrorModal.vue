<template>
  <div v-if="ui.message" class="overlay" @click.self="ui.clear()">
    <div class="modal">
      <p>{{ ui.message }}</p>
      <button class="btn" @click="ui.clear()">确定</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "../stores/ui";

const ui = useUiStore();
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  min-width: 300px;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.modal p {
  margin: 0 0 20px;
  font-size: 15px;
  color: #374151;
  word-break: break-all;
}
.btn {
  padding: 9px 28px;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}
</style>

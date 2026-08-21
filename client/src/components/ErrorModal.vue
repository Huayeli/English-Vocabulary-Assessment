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
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  min-width: 300px;
  max-width: 420px;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 6px 6px 0 0 #000;
}
.modal p {
  margin: 0 0 20px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  word-break: break-all;
  line-height: 1.7;
}
.btn {
  padding: 10px 30px;
  border: 2px solid #000;
  border-radius: 0;
  background: #FF6B6B;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
  transition: transform 0.1s linear, box-shadow 0.1s linear;
}
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
</style>

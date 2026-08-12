<template>
  <button type="button" class="code-btn" :disabled="countdown > 0 || sending" @click="onClick">
    {{ countdown > 0 ? `${countdown}s 后重发` : "获取验证码" }}
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  email: string;
  sender: (email: string) => Promise<unknown>;
}>();

const emit = defineEmits<{ (e: "error", message: string): void }>();

const countdown = ref(0);
const sending = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

async function onClick() {
  if (!props.email) {
    emit("error", "请先填写邮箱");
    return;
  }
  sending.value = true;
  try {
    await props.sender(props.email);
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  } catch (e) {
    emit("error", (e as Error).message ?? "发送失败");
  } finally {
    sending.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.code-btn {
  padding: 8px 12px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #ecf5ff;
  color: #409eff;
  cursor: pointer;
  white-space: nowrap;
}
.code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

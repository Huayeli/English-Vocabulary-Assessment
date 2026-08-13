<template>
  <div class="access-page">
    <div class="card">
      <h1>词海拾贝</h1>
      <p class="sub">英语词汇量智能评估</p>
      <p class="tip">请输入激活码进入测试系统</p>
      <form @submit.prevent="submit">
        <input v-model="code" placeholder="激活码" autocomplete="off" maxlength="16" />
        <button class="btn" :disabled="loading">进入系统</button>
      </form>
      <p class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCodeStore } from "../../stores/code";

const router = useRouter();
const store = useCodeStore();
const code = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  if (!code.value.trim()) {
    error.value = "请输入激活码";
    return;
  }
  loading.value = true;
  try {
    await store.validate(code.value.trim());
    router.replace("/");
  } catch (e) {
    error.value = (e as Error).message ?? "激活码无效";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.access-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 400px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 40px rgba(37, 99, 235, 0.15);
  text-align: center;
}
h1 {
  margin: 0 0 4px;
  font-size: 28px;
  color: #1e3a8a;
}
.sub {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 14px;
}
.tip {
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 16px;
}
input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-sizing: border-box;
  text-align: center;
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.btn {
  width: 100%;
  margin-top: 14px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
}
.error {
  min-height: 20px;
  color: #dc2626;
  font-size: 13px;
  margin-top: 8px;
}
</style>

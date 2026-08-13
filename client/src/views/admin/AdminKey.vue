<template>
  <div class="key-page">
    <div class="card">
      <h1>管理后台</h1>
      <p class="tip">请输入管理密钥进入后台</p>
      <form @submit.prevent="submit">
        <input v-model="key" type="password" placeholder="管理密钥" />
        <button class="btn" :disabled="loading">进入后台</button>
      </form>
      <p class="error">{{ error }}</p>
      <router-link class="back" to="/">返回前台</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCodeStore } from "../../stores/code";

const router = useRouter();
const store = useCodeStore();
const key = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  if (!key.value.trim()) {
    error.value = "请输入管理密钥";
    return;
  }
  loading.value = true;
  store.setAdminKey(key.value.trim());
  // 用一次请求验证密钥是否正确
  try {
    const { adminApi } = await import("../../api/admin");
    await adminApi.dashboard();
    router.replace("/admin");
  } catch (e) {
    store.clearAdminKey();
    error.value = (e as Error).message ?? "密钥错误";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.key-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  width: 380px;
  padding: 36px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(37, 99, 235, 0.15);
}
h1 {
  margin: 0 0 4px;
  color: #1e3a8a;
}
.tip {
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 16px;
}
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-sizing: border-box;
}
.btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  cursor: pointer;
}
.error {
  color: #dc2626;
  font-size: 13px;
  min-height: 18px;
  margin: 8px 0 0;
}
.back {
  display: block;
  margin-top: 10px;
  color: #6b7280;
  font-size: 13px;
}
</style>

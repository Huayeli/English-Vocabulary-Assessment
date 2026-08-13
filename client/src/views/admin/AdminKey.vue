<template>
  <div class="key-page">
    <DecoCircles />
    <div class="card key-card">
      <div class="lock">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="11" width="14" height="10" rx="3" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          <circle cx="12" cy="16" r="1.4" />
        </svg>
      </div>
      <h1>管理后台</h1>
      <p class="tip">请输入管理密钥</p>
      <form @submit.prevent="submit">
        <input v-model="key" type="password" class="field" placeholder="管理密钥" autocomplete="off" />
        <button class="btn-green enter" :disabled="loading">进入后台</button>
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
import DecoCircles from "../../components/DecoCircles.vue";

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
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.key-card {
  width: 400px;
  padding: 44px 40px 38px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.lock {
  width: 74px;
  height: 74px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
h1 {
  margin: 0 0 4px;
  font-size: 26px;
  color: var(--ink);
  letter-spacing: 4px;
}
.tip {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
}
.enter {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
}
.error {
  color: var(--danger);
  font-size: 13px;
  min-height: 18px;
  margin: 12px 0 0;
}
.back {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  font-size: 13px;
}
</style>

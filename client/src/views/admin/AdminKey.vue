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
  width: 420px;
  padding: 48px 42px 40px;
  text-align: center;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.key-card::before {
  content: "";
  position: absolute;
  top: -80px;
  left: -80px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(151, 80, 226, 0.16), rgba(151, 80, 226, 0) 70%);
  pointer-events: none;
}
.lock {
  width: 80px;
  height: 80px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4E3282, #8E6CBB);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(78, 50, 130, 0.3);
  position: relative;
  z-index: 1;
}
h1 {
  margin: 0 0 4px;
  font-size: 26px;
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
}
.tip {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
  position: relative;
  z-index: 1;
}
.enter {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  position: relative;
  z-index: 1;
}
.error {
  color: var(--danger);
  font-size: 13px;
  min-height: 18px;
  margin: 12px 0 0;
  position: relative;
  z-index: 1;
}
.back {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  font-size: 13px;
  position: relative;
  z-index: 1;
}
</style>

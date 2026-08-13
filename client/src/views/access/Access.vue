<template>
  <div class="access-page">
    <DecoCircles />
    <router-link class="admin-entry" to="/admin/key">管理后台</router-link>
    <div class="card login-card">
      <div class="brand-dot"></div>
      <h1>词海拾贝</h1>
      <p class="sub">英语词汇量智能评估</p>
      <form @submit.prevent="submit">
        <input v-model="code" class="field code-input" placeholder="请输入激活码" autocomplete="off" maxlength="16" />
        <button class="btn-green enter" :disabled="loading">进入系统</button>
      </form>
      <p class="error">{{ error }}</p>
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
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1;
}
.admin-entry {
  position: absolute;
  top: 26px;
  right: 30px;
  color: var(--primary);
  font-size: 14px;
  text-decoration: none;
  z-index: 2;
}
.login-card {
  width: 420px;
  padding: 46px 42px 40px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.brand-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  margin: 0 auto 18px;
  box-shadow: 0 0 0 8px rgba(95, 122, 99, 0.12);
}
h1 {
  margin: 0 0 4px;
  font-size: 30px;
  color: var(--ink);
  letter-spacing: 6px;
}
.sub {
  margin: 0 0 30px;
  color: var(--muted);
  font-size: 14px;
}
.code-input {
  text-align: center;
  font-size: 18px;
  letter-spacing: 3px;
  text-transform: uppercase;
}
.enter {
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
}
.error {
  min-height: 20px;
  color: var(--danger);
  font-size: 13px;
  margin: 12px 0 0;
}
</style>

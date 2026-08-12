<template>
  <div class="auth-page">
    <div class="card">
      <h1>注册</h1>
      <form @submit.prevent="submit">
        <label>用户名<input v-model="username" required minlength="2" maxlength="20" /></label>
        <label>密码<input v-model="password" type="password" required minlength="6" /></label>
        <label>确认密码<input v-model="confirm" type="password" required minlength="6" /></label>
        <label>邮箱（选填）<input v-model="email" type="email" /></label>
        <p class="error">{{ error }}</p>
        <button class="primary" :disabled="loading">注册</button>
        <div class="links">
          <router-link to="/login">已有账号，去登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { authApi } from "../../api/auth";

const router = useRouter();
const auth = useAuthStore();
const username = ref("");
const password = ref("");
const confirm = ref("");
const email = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  if (password.value !== confirm.value) {
    error.value = "两次输入的密码不一致";
    return;
  }
  loading.value = true;
  try {
    const data = (await authApi.register({
      username: username.value,
      password: password.value,
      email: email.value || undefined
    })) as { token: string; user: { role: string } };
    auth.setSession(data as any);
    router.replace(data.user.role === "ADMIN" ? "/admin/users" : "/");
  } catch (e) {
    error.value = (e as Error).message ?? "注册失败";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  width: 400px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
h1 {
  text-align: center;
}
label {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
}
input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}
.error {
  color: #e74c3c;
  font-size: 13px;
  min-height: 18px;
}
.primary {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
.links {
  margin-top: 14px;
  text-align: center;
  font-size: 13px;
}
</style>

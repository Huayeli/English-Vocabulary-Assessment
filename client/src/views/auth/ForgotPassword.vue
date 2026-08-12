<template>
  <div class="auth-page">
    <div class="card">
      <h1>找回密码</h1>
      <form @submit.prevent="submit">
        <label>
          已绑定邮箱
          <span class="code-row">
            <input v-model="email" type="email" required />
            <SendCodeButton :email="email" :sender="authApi.resetPasswordCode" @error="error = $event" />
          </span>
        </label>
        <label>验证码<input v-model="code" maxlength="6" required /></label>
        <label>新密码<input v-model="password" type="password" required minlength="6" /></label>
        <label>确认新密码<input v-model="confirm" type="password" required minlength="6" /></label>
        <p class="error">{{ error }}</p>
        <button class="primary" :disabled="loading">重置密码</button>
        <div class="links">
          <router-link to="/login">返回登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "../../api/auth";
import SendCodeButton from "../../components/SendCodeButton.vue";

const router = useRouter();
const email = ref("");
const code = ref("");
const password = ref("");
const confirm = ref("");
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
    await authApi.resetPassword({ email: email.value, code: code.value, newPassword: password.value });
    router.replace("/login");
  } catch (e) {
    error.value = (e as Error).message ?? "重置失败";
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
.code-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.code-row input {
  margin-top: 0;
  flex: 1;
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

<template>
  <div class="auth-page">
    <div class="card">
      <h1>词海拾贝</h1>
      <p class="sub">英语词汇量智能评估</p>
      <div class="tabs">
        <button :class="{ active: mode === 'password' }" @click="mode = 'password'">密码登录</button>
        <button :class="{ active: mode === 'email' }" @click="mode = 'email'">邮箱登录</button>
      </div>

      <form v-if="mode === 'password'" @submit.prevent="submitPassword">
        <label>用户名<input v-model="username" required autocomplete="username" /></label>
        <label>密码<input v-model="password" type="password" required autocomplete="current-password" /></label>
        <p class="error">{{ error }}</p>
        <button class="primary" :disabled="loading">登录</button>
        <div class="links">
          <router-link to="/forgot">忘记密码？</router-link>
          <router-link to="/register">注册账号</router-link>
        </div>
      </form>

      <form v-else @submit.prevent="submitEmail">
        <label>邮箱<input v-model="email" type="email" required autocomplete="email" /></label>
        <label class="code-row">
          验证码
          <span class="code-input">
            <input v-model="code" maxlength="6" required />
            <SendCodeButton :email="email" :sender="authApi.sendEmailCode" @error="error = $event" />
          </span>
        </label>
        <p class="error">{{ error }}</p>
        <button class="primary" :disabled="loading">登录</button>
        <div class="links">
          <router-link to="/register">注册账号</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { authApi, type PublicUser } from "../../api/auth";
import SendCodeButton from "../../components/SendCodeButton.vue";

const router = useRouter();
const auth = useAuthStore();
const mode = ref<"password" | "email">("password");
const username = ref("");
const password = ref("");
const email = ref("");
const code = ref("");
const error = ref("");
const loading = ref(false);

function routeByRole(user: PublicUser) {
  router.replace(user.role === "ADMIN" ? "/admin/users" : "/");
}

async function submitPassword() {
  error.value = "";
  loading.value = true;
  try {
    const user = await auth.login(username.value, password.value);
    routeByRole(user);
  } catch (e) {
    error.value = (e as Error).message ?? "登录失败";
  } finally {
    loading.value = false;
  }
}

async function submitEmail() {
  error.value = "";
  loading.value = true;
  try {
    const data = (await authApi.loginByEmail({ email: email.value, code: code.value })) as {
      token: string;
      user: PublicUser;
    };
    auth.setSession(data);
    routeByRole(data.user);
  } catch (e) {
    error.value = (e as Error).message ?? "登录失败";
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
  font-size: 20px;
  text-align: center;
  margin-bottom: 4px;
}
.sub {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  margin: 0 0 20px;
}
.tabs {
  display: flex;
  margin-bottom: 20px;
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: #fafafa;
  cursor: pointer;
}
.tabs button.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
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
.code-input {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.code-input input {
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
  font-size: 15px;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
}
.links {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  font-size: 13px;
}
</style>

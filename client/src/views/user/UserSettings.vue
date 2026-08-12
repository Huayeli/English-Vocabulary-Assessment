<template>
  <div class="page">
    <header class="topbar">
      <h2>账号设置</h2>
      <router-link to="/user">返回主页</router-link>
    </header>

    <div class="card">
      <h3>头像</h3>
      <input v-model="avatar" placeholder="头像图片 URL" />
      <button class="btn" @click="saveAvatar">保存</button>
      <p v-if="saved" class="ok">已保存</p>
    </div>

    <div class="card">
      <h3>绑定邮箱</h3>
      <p class="tip">绑定后可邮箱验证码登录、找回密码。</p>
      <label class="code-row">
        <input v-model="email" type="email" placeholder="邮箱地址" />
        <SendCodeButton :email="email" :sender="authApi.bindEmailCode" @error="bindError = $event" />
      </label>
      <input v-model="code" maxlength="6" placeholder="6 位验证码" class="full" />
      <p class="error">{{ bindError }}</p>
      <button class="btn" @click="bindEmail">绑定</button>
      <p v-if="bound" class="ok">绑定成功</p>
    </div>

    <div class="card">
      <h3>修改密码</h3>
      <p class="tip">通过绑定邮箱验证码重置密码。</p>
      <router-link class="btn ghost" to="/forgot">去重置密码</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "../../api/auth";
import { userApi } from "../../api/user";
import SendCodeButton from "../../components/SendCodeButton.vue";

const avatar = ref("");
const saved = ref(false);
const email = ref("");
const code = ref("");
const bindError = ref("");
const bound = ref(false);

async function saveAvatar() {
  await userApi.updateProfile({ avatar: avatar.value || undefined });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

async function bindEmail() {
  bindError.value = "";
  try {
    await authApi.bindEmail({ email: email.value, code: code.value });
    bound.value = true;
  } catch (e) {
    bindError.value = (e as Error).message ?? "绑定失败";
  }
}
</script>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}
.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
h3 {
  margin: 0 0 12px;
}
input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  margin-bottom: 10px;
}
.full {
  margin-top: 10px;
}
.code-row {
  display: flex;
  gap: 8px;
}
.code-row input {
  margin-bottom: 0;
}
.btn {
  padding: 9px 18px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
.btn.ghost {
  background: #fff;
  color: #409eff;
  border: 1px solid #409eff;
  text-decoration: none;
  display: inline-block;
}
.tip {
  color: #9ca3af;
  font-size: 13px;
}
.error {
  color: #dc2626;
  font-size: 13px;
  min-height: 18px;
}
.ok {
  color: #059669;
  font-size: 13px;
}
</style>

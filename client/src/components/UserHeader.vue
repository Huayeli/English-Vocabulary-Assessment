<template>
  <div class="user-header">
    <router-link v-if="auth.isAdmin" class="switch-link" to="/admin/users">后台管理</router-link>
    <router-link class="user-link" to="/user">
      <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="mini-avatar" alt="头像" />
      <span v-else class="mini-avatar letter">{{ (auth.user?.username?.[0] ?? "?").toUpperCase() }}</span>
      <span class="name">{{ auth.user?.username ?? "…" }}</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<style scoped>
.user-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}
.user-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #374151;
}
.mini-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.mini-avatar.letter {
  background: #409eff;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.name {
  font-size: 14px;
  font-weight: 600;
}
.switch-link {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
}
.switch-link:hover {
  text-decoration: underline;
}
</style>

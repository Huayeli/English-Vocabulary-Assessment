<template>
  <div class="layout">
    <aside class="side">
      <h3>词海拾贝 · 管理台</h3>
      <router-link to="/admin/dashboard">仪表盘</router-link>
      <router-link to="/admin/bank">题库管理</router-link>
      <router-link to="/admin/tests">测试管理</router-link>
      <router-link to="/admin/codes">激活码管理</router-link>
      <div class="spacer"></div>
      <router-link class="exit" to="/">返回前台</router-link>
      <button class="exit" @click="logout">退出管理</button>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCodeStore } from "../stores/code";

const router = useRouter();
const store = useCodeStore();

function logout() {
  store.clearAdminKey();
  router.replace("/");
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.side {
  width: 210px;
  background: #1e293b;
  color: #fff;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.side h3 {
  padding: 0 20px;
  margin-bottom: 16px;
  font-size: 15px;
}
.side a,
.side button {
  color: #cbd5e1;
  text-decoration: none;
  padding: 11px 20px;
  font-size: 14px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}
.side a.router-link-active {
  background: #334155;
  color: #fff;
  border-left: 3px solid #3b82f6;
}
.spacer {
  flex: 1;
}
.side .exit {
  color: #94a3b8;
  font-size: 13px;
}
.content {
  flex: 1;
  padding: 28px;
}
</style>

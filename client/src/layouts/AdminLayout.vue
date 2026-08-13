<template>
  <div class="layout">
    <aside class="side">
      <h3>词海拾贝 · 管理台</h3>
      <router-link to="/admin/dashboard">全局统计</router-link>
      <router-link to="/admin/bank">题库管理</router-link>
      <router-link to="/admin/tests">测试管理</router-link>
      <router-link to="/admin/codes">激活码管理</router-link>
    </aside>
    <main class="content">
      <router-view />
    </main>
    <div class="bottom-left">
      <router-link to="/">返回前台</router-link>
      <button @click="logout">退出管理</button>
    </div>
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
.content {
  flex: 1;
  padding: 28px;
}
.bottom-left {
  position: fixed;
  left: 18px;
  bottom: 16px;
  display: flex;
  gap: 10px;
  z-index: 50;
}
.bottom-left a,
.bottom-left button {
  padding: 8px 14px;
  border: 1px solid #475569;
  border-radius: 8px;
  background: #1e293b;
  color: #e2e8f0;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
}
</style>

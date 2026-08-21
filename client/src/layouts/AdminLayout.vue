<template>
  <div class="layout">
    <div class="bg-deco" aria-hidden="true">
      <span class="bd1"></span>
      <span class="bd2"></span>
      <span class="bd3"></span>
      <span class="br1"></span>
    </div>
    <aside class="side">
      <div class="brand">
        <span class="brand-dot"><img :src="logoUrl" alt="词海拾贝" /></span>
        <div>
          <b>词海拾贝</b>
          <span>管理平台</span>
        </div>
      </div>
      <router-link to="/admin/dashboard"><LineIcon name="dashboard" :size="17" />全局统计</router-link>
      <router-link to="/admin/bank"><LineIcon name="db" :size="17" />题库管理</router-link>
      <router-link to="/admin/tests"><LineIcon name="chart" :size="17" />测试管理</router-link>
      <router-link to="/admin/codes"><LineIcon name="key" :size="17" />激活码管理</router-link>
      <div class="foot">
        <router-link to="/"><LineIcon name="arrow" :size="17" />返回前台</router-link>
        <button @click="logout"><LineIcon name="x" :size="17" />退出管理</button>
      </div>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useCodeStore } from "../stores/code";
import LineIcon from "../components/LineIcon.vue";
import logoUrl from "../assets/logo.png";

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
.bg-deco {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  display: none;
}
.bg-deco span {
  position: absolute;
  border-radius: 50%;
}
.bd1 {
  width: 260px;
  height: 260px;
  top: -80px;
  right: -60px;
  background: radial-gradient(circle, rgba(162, 205, 243, 0.18), rgba(162, 205, 243, 0) 70%);
}
.bd2 {
  width: 12px;
  height: 12px;
  top: 30%;
  left: 230px;
  background: rgba(248, 199, 206, 0.4);
}
.bd3 {
  width: 20px;
  height: 20px;
  bottom: 18%;
  right: 8%;
  background: rgba(151, 80, 226, 0.22);
}
.br1 {
  width: 200px;
  height: 200px;
  bottom: -80px;
  right: 24%;
  border: 1.5px solid rgba(162, 205, 243, 0.25);
}
.side {
  width: 220px;
  background: #000;
  color: #fff;
  padding: 22px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1;
  border-right: 3px solid #000;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px 20px;
  margin-bottom: 10px;
  border-bottom: 2px solid #fff;
}
.brand-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 3px 3px 0 0 #fff;
  flex-shrink: 0;
}
.brand-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.brand b {
  display: block;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
}
.brand span {
  display: block;
  font-size: 12px;
  color: #FFD93D;
  letter-spacing: 3px;
  font-weight: 700;
}
.side a,
.side button {
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border: 3px solid transparent;
  border-radius: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  transition: background 0.1s linear, border-color 0.1s linear;
}
.side a:hover,
.side button:hover {
  border-color: #fff;
  background: #2b2b2b;
  color: #fff;
}
.side a.router-link-active {
  background: #FFD93D;
  color: #000;
  border-color: #fff;
  box-shadow: 3px 3px 0 0 #fff;
}
.content {
  flex: 1;
  padding: 30px 34px;
  min-width: 0;
  position: relative;
  z-index: 1;
}
.side .foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 2px solid #000;
}
</style>

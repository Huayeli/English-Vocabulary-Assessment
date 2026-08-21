<template>
  <div class="code-header">
    <router-link class="brand" to="/">
      <span class="brand-dot"><img :src="logoUrl" alt="词海拾贝" /></span>
      <span>词海拾贝</span>
    </router-link>
    <div class="right">
      <span class="chip">激活码 {{ masked }}</span>
      <span v-if="remaining !== null" class="chip">剩余 {{ remaining }} 次</span>
      <button class="link exit" @click="exit">退出</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCodeStore } from "../stores/code";
import LineIcon from "./LineIcon.vue";
import logoUrl from "../assets/logo.png";

const router = useRouter();
const store = useCodeStore();

const masked = computed(() => {
  const c = store.accessCode;
  return c.length > 6 ? `${c.slice(0, 4)}…${c.slice(-2)}` : c;
});

const remaining = computed(() => store.info?.remaining ?? null);

function exit() {
  store.logout();
  router.replace("/access");
}
</script>

<style scoped>
.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 18px;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 4px 4px 0 0 #000;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-body);
  color: var(--primary-dark);
  text-decoration: none;
  letter-spacing: 1px;
}
.brand-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  flex-shrink: 0;
}
.brand-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chip {
  background: #FFD93D;
  color: #000;
  border: 2px solid #000;
  border-radius: 0;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
}
.link {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}
.link.exit {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger);
  font-weight: 600;
  border: 2px solid #000;
  background: #fff;
  color: #FF6B6B;
  padding: 6px 14px;
  font-weight: 900;
  box-shadow: 2px 2px 0 0 #000;
}
</style>

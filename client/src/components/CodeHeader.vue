<template>
  <div class="code-header">
    <router-link class="brand" to="/">词海拾贝</router-link>
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
  margin-bottom: 16px;
}
.brand {
  font-size: 20px;
  font-weight: 800;
  color: #1e3a8a;
  text-decoration: none;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chip {
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 13px;
}
.link {
  color: #2563eb;
  text-decoration: none;
  font-size: 14px;
}
.link.exit {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
}
</style>

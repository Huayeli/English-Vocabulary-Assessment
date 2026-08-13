<template>
  <div class="code-header">
    <router-link class="brand" to="/">
      <LineIcon name="pearl" :size="22" />
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--primary-dark);
  text-decoration: none;
  letter-spacing: 2px;
}
.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chip {
  background: var(--primary-soft);
  color: var(--primary-dark);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 13px;
}
.link {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
}
.link.exit {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger);
}
</style>

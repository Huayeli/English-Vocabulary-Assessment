<template>
  <div class="page">
    <header class="topbar">
      <h2>用户主页</h2>
      <nav>
        <router-link to="/">测试中心</router-link>
        <router-link to="/wrong-words">错词本</router-link>
        <router-link to="/user/settings">账号设置</router-link>
        <button class="link" @click="logout">退出登录</button>
      </nav>
    </header>

    <div v-if="home" class="profile">
      <div class="avatar">{{ (home.username[0] ?? "?").toUpperCase() }}</div>
      <div class="info">
        <h3>{{ home.username }}</h3>
        <span class="pkg">{{ home.package.name }}</span>
      </div>
    </div>

    <div v-if="home" class="stats">
      <div class="stat">
        <b>{{ home.estimatedVocabulary ?? "-" }}</b>
        <span>当前词汇量</span>
      </div>
      <div class="stat">
        <b>{{ home.currentLevel ?? "-" }}</b>
        <span>当前等级</span>
      </div>
      <div class="stat">
        <b>{{ home.testCount }}</b>
        <span>测试次数</span>
      </div>
      <div class="stat">
        <b>{{ home.wrongWordCount }}</b>
        <span>错词数量</span>
      </div>
    </div>

    <h3 class="section">历史测试</h3>
    <div v-if="home?.recentTests.length" class="history">
      <router-link v-for="t in home.recentTests" :key="t.id" class="h-item" :to="`/report/${t.id}`">
        <span>{{ typeLabel(t.type) }}</span>
        <span>{{ t.finalLevel ?? "-" }}</span>
        <span>{{ Math.round((t.accuracy ?? 0) * 100) }}%</span>
        <span class="time">{{ formatTime(t.finishedTime) }}</span>
      </router-link>
    </div>
    <p v-else class="empty">还没有完成过测试</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { userApi, type UserHome } from "../../api/user";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const home = ref<UserHome | null>(null);

function typeLabel(type: string) {
  const map: Record<string, string> = { ADAPTIVE: "自适应", VERIFICATION: "验证", WRONG_WORD: "错词再测" };
  return map[type] ?? type;
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString("zh-CN") : "-";
}

function logout() {
  auth.logout();
  router.replace("/login");
}

onMounted(async () => {
  home.value = await userApi.home();
});
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
nav {
  display: flex;
  gap: 14px;
  align-items: center;
}
nav a,
.link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}
.profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.info h3 {
  margin: 0;
}
.pkg {
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 10px;
  border-radius: 10px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.stat b {
  display: block;
  font-size: 22px;
  color: #1f2937;
}
.stat span {
  font-size: 12px;
  color: #9ca3af;
}
.section {
  margin: 24px 0 12px;
}
.history {
  display: grid;
  gap: 8px;
}
.h-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 2fr;
  gap: 8px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #374151;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.time {
  color: #9ca3af;
}
.empty {
  color: #9ca3af;
}
@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

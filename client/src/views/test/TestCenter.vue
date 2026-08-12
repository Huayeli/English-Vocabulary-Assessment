<template>
  <div class="page">
    <header class="topbar">
      <h2>测试中心</h2>
      <nav>
        <router-link to="/user">用户主页</router-link>
        <router-link to="/wrong-words">错词本</router-link>
        <button class="link" @click="logout">退出登录</button>
      </nav>
    </header>

    <div v-if="quota" class="quota">
      <router-link class="plan-link" to="/plan">
        当前套餐：<b>{{ quota.packageName }}</b> · 查看套餐详情 ›
      </router-link>
      <template v-if="quota.remainingDailyTests !== null">
        <span class="remain">今日剩余测试：<b>{{ quota.remainingDailyTests }}</b> 次</span>
      </template>
      <template v-else><span class="remain">不限次数</span></template>
    </div>

    <div class="cards">
      <div class="card">
        <h3>自适应测试</h3>
        <p>30 题，根据作答动态调整等级，测出你的词汇量。</p>
        <router-link class="btn" to="/test/adaptive">开始测试</router-link>
      </div>
      <div class="card">
        <h3>等级验证</h3>
        <p>选择等级，30 题正确率达到 80% 判定达标。</p>
        <router-link v-if="quota?.verificationEnabled" class="btn" to="/test/verification">选择等级验证</router-link>
        <span v-else class="btn disabled">需开通月卡/年卡</span>
      </div>
      <div class="card">
        <h3>错词再测</h3>
        <p>针对错词本中的单词重新测试，巩固记忆。</p>
        <router-link v-if="quota?.wrongBookEnabled" class="btn" to="/test/wrong">错词再测</router-link>
        <span v-else class="btn disabled">需开通月卡/年卡</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { testApi, type QuotaInfo } from "../../api/test";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const quota = ref<QuotaInfo | null>(null);

onMounted(async () => {
  quota.value = await testApi.quota();
});

function logout() {
  auth.logout();
  router.replace("/login");
}
</script>

<style scoped>
.page {
  max-width: 960px;
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
  gap: 16px;
  align-items: center;
}
nav a,
.link {
  color: #409eff;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.quota {
  margin: 16px 0;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 8px;
  color: #31708f;
}
.plan-link {
  color: #31708f;
  text-decoration: none;
}
.plan-link:hover {
  text-decoration: underline;
}
.remain {
  margin-left: 8px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.card p {
  color: #6b7280;
  font-size: 14px;
  min-height: 42px;
}
.btn {
  display: inline-block;
  margin-top: 12px;
  padding: 9px 18px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
}
.btn.disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
@media (max-width: 720px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>

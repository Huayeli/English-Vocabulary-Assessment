<template>
  <div class="layout">
    <aside class="side">
      <h3>管理后台</h3>
      <router-link to="/admin/users">用户管理</router-link>
      <router-link to="/admin/words">词库管理</router-link>
      <router-link to="/admin/questions">题库管理</router-link>
      <router-link to="/admin/stats">数据统计</router-link>
      <router-link class="exit" to="/">返回前台</router-link>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.side {
  width: 200px;
  background: #1f2937;
  color: #fff;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.side h3 {
  padding: 0 20px;
  margin-bottom: 16px;
}
.side a {
  color: #d1d5db;
  text-decoration: none;
  padding: 10px 20px;
  font-size: 14px;
}
.side a.router-link-active {
  background: #374151;
  color: #fff;
}
.side .exit {
  margin-top: 20px;
  color: #9ca3af;
  font-size: 13px;
}
.content {
  flex: 1;
  padding: 24px;
}
</style>

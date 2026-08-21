<template>
  <div class="landing">
    <!-- 顶部导航 -->
    <header class="topbar">
      <router-link class="brand" to="/">
        <span class="brand-dot"><img :src="logoUrl" alt="词海拾贝" /></span>
        <b>词海拾贝</b>
      </router-link>
      <nav class="nav-links">
        <a href="#features">功能特性</a>
        <a href="#levels">等级体系</a>
        <a href="#about">关于</a>
      </nav>
      <router-link class="admin-entry" to="/admin/key">管理后台</router-link>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-left">
        <span class="sticker sticker-top">✦ AI 词汇测评</span>
        <h1 class="hero-title">
          <span class="line-solid">测出你的</span>
          <span class="line-outline">真实词汇量</span>
        </h1>
        <p class="hero-sub">
          词海拾贝 · 30 题自适应闯关，11 级词表精准定位。<br />
          像打怪一样，把单词一颗一颗捡进你的词海。
        </p>
        <form class="enter-form" @submit.prevent="submit">
          <input
            v-model="code"
            class="field code-input"
            placeholder="输入激活码，开始闯关"
            autocomplete="off"
            maxlength="16"
          />
          <button class="btn-green enter" :disabled="loading">{{ loading ? "验证中…" : "进入系统 →" }}</button>
        </form>
        <p class="error">{{ error }}</p>
        <div class="trust-row">
          <span><b>25,000+</b> 词库</span>
          <span><b>11</b> 等级</span>
          <span><b>30</b> 题/次</span>
          <span><b>80%</b> 达标线</span>
        </div>
      </div>

      <div class="hero-right">
        <div class="chaos">
          <span class="halftone"></span>
          <span class="shape shape-red"></span>
          <span class="shape shape-yellow"></span>
          <span class="shape shape-violet"></span>
          <LineIcon class="star star-1" name="star" :size="40" />
          <LineIcon class="star star-2" name="sparkle" :size="28" />
          <div class="logo-badge"><img :src="logoUrl" alt="词海拾贝" /></div>
          <span class="badge b1">30 题</span>
          <span class="badge b2">11 级</span>
          <span class="badge b3">AI 评测</span>
        </div>
      </div>
    </section>

    <!-- 功能 -->
    <section id="features" class="features">
      <h2 class="section-title">三大能力 <span class="tick">✦</span></h2>
      <div class="feat-grid">
        <div class="feat-card">
          <span class="feat-icon"><LineIcon name="gauge" :size="26" /></span>
          <h3>自适应测试</h3>
          <p>30 题动态升降级：连对 3 题升级、连错 2 题降级，每个等级都有充分采样。</p>
        </div>
        <div class="feat-card">
          <span class="feat-icon"><LineIcon name="target" :size="26" /></span>
          <h3>等级验证</h3>
          <p>选定目标等级，30 题正确率达到 80% 即判定达标，结果一目了然。</p>
        </div>
        <div class="feat-card">
          <span class="feat-icon"><LineIcon name="trophy" :size="26" /></span>
          <h3>词量报告</h3>
          <p>最终等级、词汇量估算、错词与中文解析，一份报告全部说清。</p>
        </div>
      </div>
    </section>

    <!-- 数据条 -->
    <section id="levels" class="stats-band">
      <div><b>25000+</b><span>词库词汇</span></div>
      <div><b>11</b><span>等级递进</span></div>
      <div><b>30</b><span>题自适应</span></div>
      <div><b>2</b><span>测试模式</span></div>
    </section>

    <!-- 页脚 -->
    <footer id="about" class="footer">
      <span class="brand-mini"><img :src="logoUrl" alt="" />词海拾贝</span>
      <span>AI 英语词汇学习平台 · 每天 5 分钟，捡起你的词海</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCodeStore } from "../../stores/code";
import LineIcon from "../../components/LineIcon.vue";
import logoUrl from "../../assets/logo.png";

const router = useRouter();
const store = useCodeStore();
const code = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  if (!code.value.trim()) {
    error.value = "请输入激活码";
    return;
  }
  loading.value = true;
  try {
    await store.validate(code.value.trim());
    router.replace("/");
  } catch (e) {
    error.value = (e as Error).message ?? "激活码无效";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- 顶部导航 ---------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 28px;
  background: #fff;
  border-bottom: 3px solid #000;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #000;
  text-decoration: none;
}
.brand b {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
}
.brand-dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
}
.brand-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.nav-links {
  display: flex;
  gap: 8px;
}
.nav-links a {
  color: #000;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  padding: 8px 14px;
  border: 3px solid transparent;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.1s linear, box-shadow 0.1s linear, background 0.1s linear;
}
.nav-links a:hover {
  border-color: #000;
  background: #FFD93D;
  box-shadow: 2px 2px 0 0 #000;
}
.admin-entry {
  color: #000;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  padding: 9px 18px;
  border: 2px solid #000;
  background: #fff;
  box-shadow: 2px 2px 0 0 #000;
  transition: transform 0.1s linear, box-shadow 0.1s linear;
}
.admin-entry:hover {
  background: #C4B5FD;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 0 #000;
}
.admin-entry:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* ---------- Hero ---------- */
.hero {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 40px;
  align-items: center;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 64px 28px 56px;
}
.hero-left {
  position: relative;
}
.sticker-top {
  display: inline-block;
  background: #C4B5FD;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  padding: 7px 16px;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 2px;
  transform: rotate(-2deg);
  margin-bottom: 18px;
}
.hero-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(46px, 6.2vw, 84px);
  line-height: 1.08;
  letter-spacing: 0;
  text-transform: uppercase;
  margin: 0 0 22px;
}
.line-solid {
  display: block;
  color: #000;
}
.line-outline {
  display: block;
  color: transparent;
  -webkit-text-stroke: 2px #000;
  transform: rotate(-1deg);
  transform-origin: left center;
  margin-top: 6px;
}
.hero-sub {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.6;
  color: #000;
  margin: 0 0 26px;
}
.enter-form {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.code-input {
  flex: 1;
  min-width: 240px;
  text-align: center;
  font-size: 17px;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 900;
}
.enter {
  min-width: 180px;
}
.error {
  min-height: 22px;
  color: #FF6B6B;
  font-weight: 900;
  font-size: 14px;
  margin: 10px 0 0;
}
.trust-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
}
.trust-row span {
  background: #fff;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 13px;
}
.trust-row b {
  font-weight: 900;
  color: #FF6B6B;
  margin-right: 4px;
}

/* ---------- Hero 右侧视觉堆叠 ---------- */
.hero-right {
  position: relative;
}
.chaos {
  position: relative;
  min-height: 420px;
}
.logo-badge {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  width: 230px;
  height: 230px;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid #000;
  box-shadow: 9px 9px 0 0 #000;
  background: #fff;
  z-index: 2;
}
.logo-badge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.halftone {
  position: absolute;
  width: 220px;
  height: 220px;
  right: 0;
  bottom: 10px;
  background-image: radial-gradient(#000 2px, transparent 2.5px);
  background-size: 22px 22px;
  border: 3px solid #000;
  z-index: 1;
}
.shape {
  position: absolute;
  border: 3px solid #000;
  z-index: 1;
}
.shape-red {
  width: 74px;
  height: 74px;
  background: #FF6B6B;
  top: 6px;
  left: 4%;
  transform: rotate(8deg);
}
.shape-yellow {
  width: 58px;
  height: 58px;
  background: #FFD93D;
  bottom: 24px;
  left: 6%;
  transform: rotate(-10deg);
  border-radius: 50%;
}
.shape-violet {
  width: 46px;
  height: 46px;
  background: #C4B5FD;
  top: 150px;
  right: 2%;
  transform: rotate(14deg);
}
.star {
  position: absolute;
  z-index: 3;
  color: #000;
  fill: #FF6B6B;
}
.star-1 {
  top: 18px;
  right: 14%;
  transform: rotate(12deg);
}
.star-2 {
  bottom: 66px;
  right: 16%;
  color: #000;
}
.badge {
  position: absolute;
  z-index: 4;
  border: 2px solid #000;
  padding: 8px 16px;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 1px;
  box-shadow: 2px 2px 0 0 #000;
}
.b1 {
  background: #FF6B6B;
  color: #fff;
  top: 46px;
  left: 10%;
  transform: rotate(-6deg);
}
.b2 {
  background: #FFD93D;
  color: #000;
  bottom: 30px;
  right: 8%;
  transform: rotate(5deg);
}
.b3 {
  background: #C4B5FD;
  color: #000;
  top: 230px;
  right: 4%;
  transform: rotate(-3deg);
}

/* ---------- 功能 ---------- */
.features {
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 28px 64px;
}
.section-title {
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 52px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 32px;
}
.tick {
  color: #FF6B6B;
  display: inline-block;
  transform: rotate(12deg);
}
.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}
.feat-card {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 5px 5px 0 0 #000;
  padding: 26px 24px;
  transition: transform 0.15s linear, box-shadow 0.15s linear;
}
.feat-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 0 #000;
}
.feat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 2px solid #000;
  background: #FFD93D;
  box-shadow: 2px 2px 0 0 #000;
  color: #000;
  margin-bottom: 16px;
}
.feat-card h3 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  margin: 0 0 8px;
}
.feat-card p {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.65;
  margin: 0;
}

/* ---------- 数据条 ---------- */
.stats-band {
  background: #000;
  color: #fff;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 3px solid #000;
  border-bottom: 3px solid #000;
}
.stats-band div {
  text-align: center;
  padding: 30px 16px;
  border-right: 2px solid #000;
}
.stats-band div:last-child {
  border-right: none;
}
.stats-band b {
  display: block;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 900;
  color: #FFD93D;
}
.stats-band span {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ---------- 页脚 ---------- */
.footer {
  margin-top: auto;
  background: #fff;
  border-top: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 28px;
  font-weight: 700;
  font-size: 14px;
}
.brand-mini {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: 1px;
}
.brand-mini img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #000;
  object-fit: cover;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
    padding-top: 40px;
  }
  .hero-right {
    display: none;
  }
  .feat-grid {
    grid-template-columns: 1fr;
  }
  .stats-band {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-band div:nth-child(2) {
    border-right: none;
  }
  .nav-links {
    display: none;
  }
}
</style>

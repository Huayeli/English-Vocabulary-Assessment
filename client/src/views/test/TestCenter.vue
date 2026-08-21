<template>
  <div class="page">
    <CodeHeader />
    <div class="content">
      <div class="head-row">
        <div>
          <span class="sticker">✦ 闯关开始</span>
          <h1 class="title">选择你的<br /><span class="outline">测试方式</span></h1>
          <p class="subtitle">30 题测出真实词汇量，选一个入口开打。</p>
        </div>
        <div class="head-deco">
          <span class="sq sq-red"></span>
          <span class="sq sq-yellow"></span>
          <LineIcon class="star" name="star" :size="36" />
        </div>
      </div>

      <div class="main-cards">
        <router-link class="main-card adaptive" to="/test/adaptive">
          <span class="ribbon">推荐</span>
          <div class="top top-red">
            <span class="icon-box"><img :src="cepingUrl" alt="自适应测试" /></span>
            <span class="top-tag">智能评测</span>
          </div>
          <div class="body">
            <h3>自适应测试</h3>
            <p>30 题动态调整等级，连对升级、连错降级，测出你的真实词汇量</p>
            <div class="lv-row">
              <span class="lv" v-for="l in ['1K', '2K', '3K', '4K', '5K', '6K', '7K', '8K', '9K', '10K', '10K+']" :key="l" :style="lvStyle(l)">{{ l }}</span>
            </div>
            <button class="btn-yellow start">开始挑战 →</button>
          </div>
        </router-link>

        <router-link class="main-card verify" to="/test/verification">
          <span class="ribbon ribbon-violet">达标制</span>
          <div class="top top-yellow">
            <span class="icon-box"><img :src="dengjiUrl" alt="等级验证" /></span>
            <span class="top-tag">等级达标</span>
          </div>
          <div class="body">
            <h3>等级验证</h3>
            <p>选定目标等级，30 题正确率达到 80% 即判定达标</p>
            <div class="lv-row">
              <span class="lv" v-for="l in ['1K', '2K', '3K', '4K', '5K', '6K', '7K', '8K', '9K', '10K', '10K+']" :key="l" :style="lvStyle(l)">{{ l }}</span>
            </div>
            <button class="btn-green start">开始验证 →</button>
          </div>
        </router-link>
      </div>

      <div class="mini-grid">
        <div class="mini"><span class="m-box"><LineIcon name="list" :size="16" /></span><span>30 题自适应测评</span></div>
        <div class="mini"><span class="m-box m-yellow"><LineIcon name="check" :size="16" /></span><span>80% 达标判定</span></div>
        <div class="mini"><span class="m-box m-violet"><LineIcon name="report" :size="16" /></span><span>详细词汇量报告</span></div>
        <div class="mini"><span class="m-box m-red"><LineIcon name="shield" :size="16" /></span><span>防作弊可信度检测</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useCodeStore } from "../../stores/code";
import CodeHeader from "../../components/CodeHeader.vue";
import LineIcon from "../../components/LineIcon.vue";
import cepingUrl from "../../assets/ceping.png";
import dengjiUrl from "../../assets/dengji.png";

const store = useCodeStore();

const LEVEL_COLORS: Record<string, string> = {
  "1K": "#8E6CBB",
  "2K": "#4CBFA6",
  "3K": "#5B8FF9",
  "4K": "#F5A623",
  "5K": "#D97AB0",
  "6K": "#B69CD2",
  "7K": "#A2CDF3",
  "8K": "#C9A7E8",
  "9K": "#F8C7CE",
  "10K": "#F1A9BE",
  "10K+": "#E59BB4"
};

function lvStyle(level: string) {
  return { background: LEVEL_COLORS[level] };
}

onMounted(() => {
  store.refreshInfo();
});
</script>

<style scoped>
.page {
  max-width: 1020px;
  margin: 0 auto;
  padding: 22px 28px 60px;
}
.content {
  position: relative;
  z-index: 1;
}

/* ---------- 头部 ---------- */
.head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin: 34px 0 30px;
}
.sticker {
  display: inline-block;
  background: #FFD93D;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  padding: 6px 14px;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 2px;
  transform: rotate(-2deg);
  margin-bottom: 14px;
}
.title {
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 900;
  line-height: 0.98;
  letter-spacing: -1px;
  margin: 0 0 10px;
}
.outline {
  color: transparent;
  -webkit-text-stroke: 3px #000;
  display: inline-block;
  transform: rotate(-1.2deg);
}
.subtitle {
  font-weight: 700;
  font-size: 16px;
  margin: 0;
}
.head-deco {
  position: relative;
  width: 150px;
  height: 120px;
  flex-shrink: 0;
}
.sq {
  position: absolute;
  border: 3px solid #000;
}
.sq-red {
  width: 64px;
  height: 64px;
  background: #FF6B6B;
  top: 0;
  right: 10px;
  transform: rotate(8deg);
}
.sq-yellow {
  width: 42px;
  height: 42px;
  background: #FFD93D;
  bottom: 0;
  left: 0;
  transform: rotate(-10deg);
}
.star {
  position: absolute;
  top: 18px;
  left: 8px;
  color: #000;
  fill: #FF6B6B;
  transform: rotate(14deg);
}

/* ---------- 测试卡片 ---------- */
.main-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.main-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 3px solid #000;
  box-shadow: 6px 6px 0 0 #000;
  text-decoration: none;
  color: #000;
  transition: transform 0.15s linear, box-shadow 0.15s linear;
}
.main-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 10px 10px 0 0 #000;
}
.ribbon {
  position: absolute;
  top: -16px;
  right: -12px;
  z-index: 3;
  background: #FF6B6B;
  color: #fff;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  padding: 6px 16px;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 2px;
  transform: rotate(4deg);
}
.ribbon-violet {
  background: #C4B5FD;
  color: #000;
  transform: rotate(-4deg);
}
.top {
  position: relative;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid #000;
}
.top-red {
  background: #FF6B6B;
}
.top-yellow {
  background: #FFD93D;
}
.icon-box {
  width: 80px;
  height: 80px;
  background: #fff;
  border: 3px solid #000;
  box-shadow: 3px 3px 0 0 #000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #000;
  overflow: hidden;
}
.icon-box img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  display: block;
}
.top-tag {
  position: absolute;
  top: 12px;
  left: 14px;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 2px 2px 0 0 #000;
  padding: 4px 12px;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 2px;
}
.body {
  padding: 26px 26px 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}
.main-card h3 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 900;
  margin: 0 0 8px;
}
.main-card p {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
}
.lv-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}
.lv {
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  font-family: var(--font-display);
  border: 2px solid #000;
  padding: 3px 9px;
  box-shadow: 2px 2px 0 0 #000;
}
.start {
  margin-top: auto;
  width: 100%;
}

/* ---------- 特性小卡 ---------- */
.mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 34px;
}
.mini {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 0 #000;
  padding: 14px 12px;
  font-weight: 700;
  font-size: 13px;
}
.m-box {
  width: 34px;
  height: 34px;
  border: 2px solid #000;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
}
.m-yellow {
  background: #FFD93D;
}
.m-violet {
  background: #C4B5FD;
}
.m-red {
  background: #FF6B6B;
  color: #fff;
}

@media (max-width: 820px) {
  .main-cards {
    grid-template-columns: 1fr;
  }
  .mini-grid {
    grid-template-columns: 1fr 1fr;
  }
  .head-deco {
    display: none;
  }
}
</style>

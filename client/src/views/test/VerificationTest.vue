<template>
  <div class="page">
    <DecoCircles />
    <div v-if="!started" class="level-picker">
      <div class="head">
        <div>
          <h2>选择要验证的等级</h2>
          <p class="tip">每个等级对应 BNC/COCA 词表的词汇范围，30 题正确率达到 80% 判定达标。</p>
        </div>
        <router-link class="back" to="/">返回测试中心</router-link>
      </div>
      <div class="levels">
        <button v-for="lv in LEVEL_INFO" :key="lv.key" class="level" @click="choose(lv.key)">
          <span class="badge" :style="{ background: lv.color }">{{ lv.key }}</span>
          <span class="texts">
            <span class="name">{{ lv.key }} <em>{{ lv.tag }}</em></span>
            <span class="desc">{{ lv.desc }}</span>
          </span>
          <LineIcon class="arrow" name="arrow" :size="20" />
        </button>
      </div>
    </div>
    <TestRunner v-else mode="verification" />
    <ConfirmDialog
      v-if="pendingConfirm"
      message="检测到上次测试未完成，是否放弃并重新开始？"
      @confirm="confirmAbandon"
      @cancel="cancelAbandon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTestStore } from "../../stores/test";
import { useUiStore } from "../../stores/ui";
import TestRunner from "../../components/TestRunner.vue";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import DecoCircles from "../../components/DecoCircles.vue";
import LineIcon from "../../components/LineIcon.vue";

const LEVEL_INFO = [
  { key: "1K", color: "#8E6CBB", tag: "入门基础", desc: "最核心高频词，日常交流的地基" },
  { key: "2K", color: "#4CBFA6", tag: "日常交流", desc: "常见对话与基础阅读词汇" },
  { key: "3K", color: "#5B8FF9", tag: "稳扎稳打", desc: "应对大多数日常场景与中等难度文本" },
  { key: "4K", color: "#F5A623", tag: "进阶过渡", desc: "连接 3K 与 5K 的过渡词汇" },
  { key: "5K", color: "#D97AB0", tag: "进阶阅读", desc: "可流畅阅读普通新闻、文章与小说" },
  { key: "6K", color: "#B69CD2", tag: "高阶阅读", desc: "更高频的书面与学术词汇" },
  { key: "7K", color: "#A2CDF3", tag: "高阶阅读", desc: "深度阅读常见的高级词汇" },
  { key: "8K", color: "#C9A7E8", tag: "接近母语", desc: "接近母语者常用词汇" },
  { key: "9K", color: "#F8C7CE", tag: "接近母语", desc: "高阶书面与专业领域词汇" },
  { key: "10K", color: "#F1A9BE", tag: "接近母语", desc: "接近母语者常用词汇，可阅读学术材料" },
  { key: "10K+", color: "#E59BB4", tag: "高阶挑战", desc: "高阶词汇，覆盖专业领域与罕见词" }
];
const LEVEL_MAP: Record<string, string> = {
  "1K": "K1",
  "2K": "K2",
  "3K": "K3",
  "4K": "K4",
  "5K": "K5",
  "6K": "K6",
  "7K": "K7",
  "8K": "K8",
  "9K": "K9",
  "10K": "K10",
  "10K+": "K10P"
};

const test = useTestStore();
const ui = useUiStore();
const started = ref(false);
const pendingConfirm = ref(false);
const pendingLevel = ref("");

async function choose(level: string) {
  try {
    const r = await test.ensureStart("verification", LEVEL_MAP[level]);
    if (r.needsConfirm) {
      pendingLevel.value = level;
      pendingConfirm.value = true;
      return;
    }
    started.value = true;
  } catch (e) {
    ui.error((e as Error).message ?? "启动失败");
  }
}

async function confirmAbandon() {
  pendingConfirm.value = false;
  try {
    await test.abandonActiveAndStart("verification", LEVEL_MAP[pendingLevel.value]);
    started.value = true;
  } catch (e) {
    ui.error((e as Error).message ?? "启动失败");
  }
}

function cancelAbandon() {
  pendingConfirm.value = false;
}
</script>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px;
}
.level-picker {
  position: relative;
  z-index: 1;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
h2 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  color: var(--primary-dark);
  letter-spacing: 1px;
}
.tip {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}
.levels {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.level {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  border: 2px solid #000;
  border-radius: 0;
  background: var(--card);
  cursor: pointer;
  text-align: left;
  box-shadow: 3px 3px 0 0 #000;
  transition: transform 0.1s linear, box-shadow 0.1s linear;
}
.level:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 0 #000;
}
.badge {
  min-width: 64px;
  height: 64px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-display);
  box-shadow: 0 8px 18px rgba(78, 50, 130, 0.25);
  flex-shrink: 0;
}
.texts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.name {
  font-size: 19px;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--ink);
}
.name em {
  font-style: normal;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--primary);
  background: var(--primary-soft);
  border-radius: 999px;
  padding: 2px 10px;
  margin-left: 8px;
  vertical-align: 2px;
}
.desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.arrow {
  color: var(--muted);
  flex-shrink: 0;
  transition: transform 0.15s, color 0.15s;
}
.level:hover .arrow {
  transform: translateX(4px);
  color: var(--primary);
}
.back {
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  padding: 9px 18px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: #fff;
  transition: background 0.15s;
}
.back:hover {
  background: var(--primary-soft);
}
</style>

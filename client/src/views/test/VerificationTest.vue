<template>
  <div class="page">
    <div v-if="!started" class="level-picker">
      <h2>选择要验证的等级</h2>
      <p class="tip">每个等级对应 BNC/COCA 词表的词汇范围，30 题正确率达到 80% 判定达标。</p>
      <div class="levels">
        <button v-for="lv in LEVEL_INFO" :key="lv.key" class="level" @click="choose(lv.key)">
          <span class="name">{{ lv.key }}</span>
          <span class="desc">{{ lv.desc }}</span>
        </button>
      </div>
      <router-link class="back" to="/">返回测试中心</router-link>
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

const LEVEL_INFO = [
  { key: "1K", desc: "最核心高频词，日常交流的基础" },
  { key: "2K", desc: "常见对话与基础阅读词汇" },
  { key: "3K", desc: "应对大多数日常场景与中等难度文本" },
  { key: "5K", desc: "可流畅阅读普通新闻、文章与小说" },
  { key: "10K", desc: "接近母语者常用词汇，可阅读学术材料" },
  { key: "10K+", desc: "高阶词汇，覆盖专业领域与罕见词" }
];
const LEVEL_MAP: Record<string, string> = {
  "1K": "K1",
  "2K": "K2",
  "3K": "K3",
  "5K": "K5",
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
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
.level-picker {
  text-align: center;
}
.tip {
  color: #6b7280;
  font-size: 14px;
}
.levels {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 24px 0;
}
.level {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border: 2px solid #409eff;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.level:hover {
  background: #ecf5ff;
}
.name {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}
.desc {
  font-size: 13px;
  color: #4b5563;
}
.back {
  display: block;
  color: #6b7280;
  font-size: 13px;
}
@media (max-width: 640px) {
  .levels {
    grid-template-columns: 1fr;
  }
}
</style>

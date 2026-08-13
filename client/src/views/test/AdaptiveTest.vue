<template>
  <div>
    <TestRunner mode="adaptive" />
    <ConfirmDialog
      v-if="pendingConfirm"
      message="检测到上次测试未完成，是否放弃并重新开始？"
      @confirm="confirmAbandon"
      @cancel="cancelAbandon"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";
import { useUiStore } from "../../stores/ui";
import TestRunner from "../../components/TestRunner.vue";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import { ref } from "vue";

const router = useRouter();
const test = useTestStore();
const ui = useUiStore();
const pendingConfirm = ref(false);

onMounted(async () => {
  if (test.finished) test.reset();
  if (!test.sessionId) {
    try {
      const r = await test.ensureStart("adaptive");
      if (r.needsConfirm) {
        pendingConfirm.value = true;
        return;
      }
    } catch (e) {
      ui.error((e as Error).message ?? "启动测试失败");
      router.replace("/");
    }
  }
});

async function confirmAbandon() {
  pendingConfirm.value = false;
  try {
    await test.abandonActiveAndStart("adaptive");
  } catch (e) {
    ui.error((e as Error).message ?? "启动失败");
    router.replace("/");
  }
}

function cancelAbandon() {
  pendingConfirm.value = false;
  router.replace("/");
}
</script>

<template>
  <TestRunner />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";
import { useUiStore } from "../../stores/ui";
import TestRunner from "../../components/TestRunner.vue";

const router = useRouter();
const test = useTestStore();
const ui = useUiStore();

onMounted(async () => {
  if (test.finished) test.reset();
  if (!test.sessionId) {
    try {
      await test.start("wrong");
    } catch (e) {
      ui.error((e as Error).message ?? "启动失败");
      router.replace("/wrong-words");
    }
  }
});
</script>

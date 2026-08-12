<template>
  <TestRunner />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTestStore } from "../../stores/test";
import TestRunner from "../../components/TestRunner.vue";

const router = useRouter();
const test = useTestStore();

onMounted(async () => {
  if (test.finished) test.reset();
  if (!test.sessionId) {
    try {
      await test.start("wrong");
    } catch (e) {
      alert((e as Error).message ?? "启动失败");
      router.replace("/wrong-words");
    }
  }
});
</script>

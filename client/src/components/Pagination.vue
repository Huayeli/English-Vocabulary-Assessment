<template>
  <div class="pager">
    <button :disabled="page <= 1" @click="$emit('change', page - 1)">上一页</button>
    <span>第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 条</span>
    <button :disabled="page >= totalPages" @click="$emit('change', page + 1)">下一页</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ page: number; pageSize: number; total: number }>();
defineEmits<{ (e: "change", page: number): void }>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin-top: 14px;
}
.pager button {
  padding: 7px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pager span {
  color: #6b7280;
  font-size: 13px;
}
</style>

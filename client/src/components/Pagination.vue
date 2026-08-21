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
  padding: 8px 18px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  font-weight: 600;
  transition: background 0.15s, border-color 0.15s;
}
.pager button:not(:disabled):hover {
  background: var(--primary-soft);
  border-color: var(--primary);
}
.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pager span {
  color: var(--muted);
  font-size: 13px;
}
</style>

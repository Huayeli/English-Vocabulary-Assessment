<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-if="name === 'gauge'">
      <path d="M12 15l4-6" />
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 6.5a9 9 0 0 0 15 0" />
    </g>
    <g v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </g>
    <g v-else-if="name === 'list'">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </g>
    <g v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </g>
    <g v-else-if="name === 'report'">
      <path d="M5 20V10M12 20V4M19 20v-7" />
      <path d="M3 20h18" />
    </g>
    <g v-else-if="name === 'shield'">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9.5 11.5l2 2 3.5-4" />
    </g>
    <g v-else-if="name === 'pearl'">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
</script>

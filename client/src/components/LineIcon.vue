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
      <path d="M7.2 12l3 3 6.6-7.2" stroke-width="1.8" />
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
    <g v-else-if="name === 'logo'" stroke-width="1.7">
      <path d="M12 10.8L4.5 12.8V18.4L12 20L19.5 18.4V12.8L12 10.8Z" />
    </g>
    <g v-else-if="name === 'db'">
      <ellipse cx="12" cy="6" rx="6" ry="3" fill="currentColor" stroke="none" />
      <path d="M6 6v9c0 1.8 12 1.8 12 0V6" fill="currentColor" stroke="none" />
    </g>
    <g v-else-if="name === 'dashboard'">
      <rect x="3.6" y="3.6" width="7.2" height="7.2" rx="2.2" fill="currentColor" stroke="none" />
      <rect x="13.2" y="3.6" width="7.2" height="7.2" rx="2.2" fill="currentColor" stroke="none" />
      <rect x="3.6" y="13.2" width="7.2" height="7.2" rx="2.2" fill="currentColor" stroke="none" />
      <rect x="13.2" y="13.2" width="7.2" height="7.2" rx="2.2" fill="currentColor" stroke="none" />
    </g>
    <g v-else-if="name === 'key'">
      <circle cx="9" cy="12" r="5" />
      <path d="M13 15l6 6M17 17l2-2" />
    </g>
    <g v-else-if="name === 'trophy'">
      <path d="M8.4 7.2h7.2v4.8c0 3-7.2 3-7.2 0z" stroke-width="1.2" />
      <path d="M10.2 16.8h3.6" stroke-width="1.2" />
    </g>
    <g v-else-if="name === 'flame'">
      <path d="M12 3c1.5 2.5 4.5 4.5 4.5 8.2A4.5 4.5 0 0 1 7.5 11c0-1.6.6-2.9 1.4-4 .3 1 .9 1.6 1.6 2-.2-2 .4-4.2 1.5-6z" />
      <path d="M12 21a4.2 4.2 0 0 1-4.2-4.2C7.8 14 12 11.5 12 11.5s4.2 2.5 4.2 5.3A4.2 4.2 0 0 1 12 21z" />
    </g>
    <g v-else-if="name === 'lock'">
      <rect x="5" y="11" width="14" height="10" rx="3" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.4" />
    </g>
    <g v-else-if="name === 'bolt'">
      <path d="M13 2L5 13h5l-1 9 8-11h-5z" />
    </g>
    <g v-else-if="name === 'star'">
      <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.4 6.7 19.1l1.1-5.8L3.5 9.2l5.9-.8z" />
    </g>
    <g v-else-if="name === 'sparkle'">
      <path d="M12 4l1.8 4.4 4.2 1.6-4.2 1.6L12 16l-1.8-4.4L6 10l4.2-1.6z" />
      <circle cx="18.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </g>
    <g v-else-if="name === 'users'">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6M17.6 15.4c1.6.7 2.6 2.2 2.9 4.6" />
    </g>
    <g v-else-if="name === 'gear'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8" />
    </g>
    <g v-else-if="name === 'chart'">
      <path d="M5 20V10M12 20V4M19 20v-7" />
      <path d="M3 20h18" />
    </g>
    <g v-else-if="name === 'arrow'">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </g>
    <g v-else-if="name === 'award'">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L8 21l4-2.5L16 21l-1-7.5" />
    </g>
    <g v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </g>
    <g v-else-if="name === 'x'">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </g>
    <g v-else-if="name === 'code'">
      <path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5M13.5 5l-3 14" />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
</script>

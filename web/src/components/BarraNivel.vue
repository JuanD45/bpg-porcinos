<script setup lang="ts">
import { computed } from 'vue';

/** Barra de cumplimiento con marca de la meta. Sin meta, se pinta con el color de acento. */
const props = defineProps<{ pct: number; meta?: number }>();
const ancho = computed(() => `${Math.max(0, Math.min(1, props.pct)) * 100}%`);
const bajo = computed(() => props.meta !== undefined && props.pct < props.meta - 1e-9);
</script>

<template>
  <div class="bar" :class="{ neutral: meta === undefined }" aria-hidden="true">
    <b :class="{ low: bajo }" :style="{ width: ancho }"></b>
    <i v-if="meta !== undefined" :style="{ left: `calc(${meta * 100}% - 1px)` }"></i>
  </div>
</template>

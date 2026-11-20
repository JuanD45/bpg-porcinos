<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps<{
  titulo: string;
  boton: string;
  error?: string;
  ocupado?: boolean;
  ancho?: string;
}>();
const emit = defineEmits<{ enviar: []; cerrar: [] }>();
const form = ref<HTMLFormElement | null>(null);

function tecla(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cerrar');
}
onMounted(() => {
  document.addEventListener('keydown', tecla);
  const primero = form.value?.querySelector<HTMLElement>('input, select, textarea');
  primero?.focus();
});
onBeforeUnmount(() => document.removeEventListener('keydown', tecla));
</script>

<template>
  <div class="scrim" @mousedown.self="emit('cerrar')">
    <form
      ref="form"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      novalidate
      :style="ancho ? { width: `min(${ancho}, 100%)` } : undefined"
      @submit.prevent="emit('enviar')"
    >
      <h2 id="modal-titulo">{{ titulo }}</h2>
      <slot />
      <p v-if="error" class="ferr" role="alert">{{ error }}</p>
      <div class="row" style="justify-content: flex-end">
        <button type="button" class="btn" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="btn primary" :disabled="ocupado">{{ ocupado ? 'Guardando…' : boton }}</button>
      </div>
    </form>
  </div>
</template>

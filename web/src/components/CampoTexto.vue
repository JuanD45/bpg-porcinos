<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

/**
 * Campo que guarda solo: tras una pausa de escritura o al salir del campo.
 * Mientras se escribe no se pisa con los datos que llegan del servidor.
 */
const props = defineProps<{
  modelValue: string | number | null;
  id: string;
  tipo?: 'text' | 'area' | 'date' | 'number';
  placeholder?: string;
  etiqueta?: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ guardar: [valor: string] }>();

const local = ref(props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue));
const enFoco = ref(false);
let temporizador: ReturnType<typeof setTimeout> | null = null;
let ultimoEnviado = local.value;

watch(
  () => props.modelValue,
  (v) => {
    if (!enFoco.value) {
      local.value = v === null || v === undefined ? '' : String(v);
      ultimoEnviado = local.value;
    }
  },
);

function enviar() {
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  if (local.value !== ultimoEnviado) {
    ultimoEnviado = local.value;
    emit('guardar', local.value);
  }
}
function alEscribir() {
  if (props.tipo === 'date') return enviar();
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(enviar, 700);
}
function alSalir() {
  enFoco.value = false;
  enviar();
}
onBeforeUnmount(enviar);
</script>

<template>
  <textarea
    v-if="tipo === 'area' || !tipo"
    :id="id"
    v-model="local"
    :placeholder="placeholder"
    :aria-label="etiqueta"
    :disabled="disabled"
    @focus="enFoco = true"
    @input="alEscribir"
    @blur="alSalir"
  ></textarea>
  <input
    v-else
    :id="id"
    v-model="local"
    :type="tipo"
    :min="tipo === 'number' ? 0 : undefined"
    :step="tipo === 'number' ? 1000 : undefined"
    :placeholder="placeholder"
    :aria-label="etiqueta"
    :disabled="disabled"
    @focus="enFoco = true"
    @input="alEscribir"
    @change="tipo === 'date' && enviar()"
    @blur="alSalir"
  />
</template>

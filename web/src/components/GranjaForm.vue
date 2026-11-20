<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../api';
import ModalDialog from './ModalDialog.vue';
import type { Granja } from '../types';

const props = defineProps<{ granja?: Granja }>();
const emit = defineEmits<{ cerrar: []; guardada: [g: Granja] }>();

const datos = reactive({
  nombre: props.granja?.nombre || '',
  municipio: props.granja?.municipio || '',
  registroSanitario: props.granja?.registroSanitario || '',
  asi: props.granja?.asi || '',
  mvz: props.granja?.mvz || '',
  tipo: props.granja?.tipo || '',
});
const error = ref('');
const ocupado = ref(false);

const CAMPOS: { k: keyof typeof datos; label: string; ancho?: boolean }[] = [
  { k: 'nombre', label: 'Nombre de la granja', ancho: true },
  { k: 'municipio', label: 'Municipio / Departamento' },
  { k: 'registroSanitario', label: 'Registro sanitario (RSPP / ISPP)' },
  { k: 'asi', label: 'Autorización sanitaria (ASI)' },
  { k: 'mvz', label: 'Médico veterinario responsable' },
  { k: 'tipo', label: 'Tipo de explotación / genética', ancho: true },
];

async function guardar() {
  if (!datos.nombre.trim()) {
    error.value = 'Escribe el nombre de la granja.';
    return;
  }
  ocupado.value = true;
  error.value = '';
  try {
    const g = props.granja
      ? await api<Granja>(`/granjas/${props.granja.id}`, { method: 'PATCH', body: datos })
      : await api<Granja>('/granjas', { method: 'POST', body: datos });
    emit('guardada', g);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar.';
  } finally {
    ocupado.value = false;
  }
}
</script>

<template>
  <ModalDialog
    :titulo="granja ? 'Editar granja' : 'Nueva granja'"
    :boton="granja ? 'Guardar' : 'Crear granja'"
    :error="error"
    :ocupado="ocupado"
    @enviar="guardar"
    @cerrar="emit('cerrar')"
  >
    <div class="fgrid">
      <div v-for="c in CAMPOS" :key="c.k" class="field" :class="{ wide: c.ancho }">
        <label :for="`g-${c.k}`">{{ c.label }}</label>
        <input :id="`g-${c.k}`" v-model="datos[c.k]" type="text" />
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { prioridad } from '../lib/prioridad';
import { NOMBRE_NIVEL, type Estado, type Evidencia, type Requisito, type Respuesta } from '../types';
import CampoTexto from './CampoTexto.vue';
import EvidenciasGaleria from './EvidenciasGaleria.vue';

const props = defineProps<{
  requisito: Requisito;
  respuesta: Respuesta | undefined;
  evaluacionId: string;
  editable: boolean;
}>();
const emit = defineEmits<{
  guardar: [cambios: Partial<Respuesta>];
  evidencias: [lista: Evidencia[]];
  verPlan: [];
}>();

const estado = computed(() => props.respuesta?.estado || null);
const pr = computed(() => prioridad(props.requisito.nivel, estado.value));
const evidencias = computed(() => props.respuesta?.evidencias || []);
const claseEstado = computed(() => (estado.value ? `s-${estado.value.replace(' ', '_')}` : ''));

const OPCIONES: { v: Estado; texto: string; clase: string }[] = [
  { v: 'CUMPLE', texto: 'Cumple', clase: 'c' },
  { v: 'NO CUMPLE', texto: 'No cumple', clase: 'n' },
  { v: 'NO APLICA', texto: 'No aplica', clase: 'a' },
];

/** Tocar el estado ya marcado lo deja sin calificar. */
function marcar(v: Estado) {
  emit('guardar', { estado: estado.value === v ? null : v });
}
</script>

<template>
  <article class="item" :class="claseEstado">
    <div>
      <div class="meta">
        <span class="mono" style="color: var(--ink)">{{ requisito.codigo }}</span>
        <span class="chip" :class="`lv-${requisito.nivel}`">{{ requisito.nivel }} · {{ NOMBRE_NIVEL[requisito.nivel] }}</span>
        <span>{{ requisito.referencia }}</span>
        <span v-if="pr" class="chip" :class="pr.clase">Prioridad {{ pr.texto }}</span>
        <span v-if="evidencias.length" class="chip st-na">
          {{ evidencias.length }} evidencia{{ evidencias.length > 1 ? 's' : '' }}
        </span>
      </div>
      <div class="req">{{ requisito.requisito }}</div>
      <div class="ev"><b>Evidencia exigida:</b> {{ requisito.evidencia || '—' }}</div>
    </div>
    <div class="side">
      <div class="seg" role="group" :aria-label="`Estado del ítem ${requisito.codigo}`">
        <button
          v-for="o in OPCIONES"
          :key="o.v"
          type="button"
          :class="o.clase"
          :aria-pressed="estado === o.v"
          :disabled="!editable"
          @click="marcar(o.v)"
        >
          {{ o.texto }}
        </button>
      </div>
      <CampoTexto
        :id="`obs-${requisito.id}`"
        :model-value="respuesta?.observaciones || ''"
        placeholder="Observaciones / hallazgos en granja"
        :etiqueta="`Observaciones del ítem ${requisito.codigo}`"
        :disabled="!editable"
        @guardar="(v) => emit('guardar', { observaciones: v })"
      />
      <EvidenciasGaleria
        :evaluacion-id="evaluacionId"
        :requisito-id="requisito.id"
        :codigo="requisito.codigo"
        :evidencias="evidencias"
        etiqueta="Evidencias"
        @cambio="(l) => emit('evidencias', l)"
      />
      <button
        v-if="estado === 'NO CUMPLE'"
        type="button"
        class="linkbtn"
        style="align-self: flex-start; font-size: 13px"
        @click="emit('verPlan')"
      >
        {{ respuesta?.accion ? 'Ver acción correctiva' : 'Definir acción correctiva' }} →
      </button>
    </div>
  </article>
</template>

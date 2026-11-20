<script setup lang="ts">
import { computed } from 'vue';
import { hoyISO } from '../lib/formato';
import { prioridad } from '../lib/prioridad';
import type { Avance, Evidencia, Requisito, Respuesta } from '../types';
import CampoTexto from './CampoTexto.vue';
import EvidenciasGaleria from './EvidenciasGaleria.vue';

const props = defineProps<{
  requisito: Requisito;
  respuesta: Respuesta;
  evaluacionId: string;
  editable: boolean;
}>();
const emit = defineEmits<{
  guardar: [cambios: Partial<Respuesta>];
  evidencias: [lista: Evidencia[]];
}>();

const pr = computed(() => prioridad(props.requisito.nivel, 'NO CUMPLE'));
const vencida = computed(
  () => !!props.respuesta.fechaCompromiso && props.respuesta.fechaCompromiso < hoyISO() && props.respuesta.avance !== 'Cerrado',
);
const claseAvance = computed(() =>
  props.respuesta.avance === 'Cerrado' ? 'st-ok' : props.respuesta.avance === 'En ejecución' ? 'st-warn' : 'st-na',
);
const AVANCES: (Avance | '')[] = ['', 'Pendiente', 'En ejecución', 'Cerrado'];
const id = (c: string) => `${c}-${props.requisito.id}`;

function guardarInversion(v: string) {
  const n = v === '' ? null : Number(v);
  emit('guardar', { inversion: n === null || Number.isFinite(n) ? n : null });
}
</script>

<template>
  <article class="plan">
    <div class="row" style="font-size: 12px">
      <span class="mono">{{ requisito.codigo }}</span>
      <span class="chip" :class="`lv-${requisito.nivel}`">{{ requisito.nivel }}</span>
      <span class="chip" :class="pr.clase">Prioridad {{ pr.texto }}</span>
      <span v-if="respuesta.avance" class="chip" :class="claseAvance">{{ respuesta.avance }}</span>
      <span v-if="vencida" class="chip st-bad">Vencida</span>
    </div>
    <div>
      <div style="font-weight: 600">{{ requisito.requisito }}</div>
      <div class="muted" style="font-size: 14px">
        <b style="color: var(--ink); font-weight: 500">Hallazgo:</b>
        {{ respuesta.observaciones || 'Sin observación registrada en la lista de chequeo.' }}
      </div>
    </div>
    <div class="fgrid">
      <div class="field wide">
        <label :for="id('ac')">Acción correctiva específica</label>
        <CampoTexto :id="id('ac')" :model-value="respuesta.accion" :disabled="!editable" @guardar="(v) => emit('guardar', { accion: v })" />
      </div>
      <div class="field wide">
        <label :for="id('ec')">Evidencia / soporte de cierre</label>
        <CampoTexto
          :id="id('ec')"
          tipo="text"
          :model-value="respuesta.evidenciaCierre"
          :disabled="!editable"
          @guardar="(v) => emit('guardar', { evidenciaCierre: v })"
        />
      </div>
      <div class="field">
        <label :for="id('re')">Responsable</label>
        <CampoTexto
          :id="id('re')"
          tipo="text"
          :model-value="respuesta.responsable"
          :disabled="!editable"
          @guardar="(v) => emit('guardar', { responsable: v })"
        />
      </div>
      <div class="field">
        <label :for="id('fe')">Fecha compromiso</label>
        <CampoTexto
          :id="id('fe')"
          tipo="date"
          :model-value="respuesta.fechaCompromiso"
          :disabled="!editable"
          @guardar="(v) => emit('guardar', { fechaCompromiso: v || null })"
        />
      </div>
      <div class="field">
        <label :for="id('in')">Inversión estimada (COP)</label>
        <CampoTexto :id="id('in')" tipo="number" :model-value="respuesta.inversion" :disabled="!editable" @guardar="guardarInversion" />
      </div>
      <div class="field">
        <label :for="id('av')">Estado de avance</label>
        <select
          :id="id('av')"
          :value="respuesta.avance || ''"
          :disabled="!editable"
          @change="emit('guardar', { avance: (($event.target as HTMLSelectElement).value || null) as Avance | null })"
        >
          <option v-for="a in AVANCES" :key="a" :value="a">{{ a || 'Sin definir' }}</option>
        </select>
      </div>
    </div>
    <EvidenciasGaleria
      :evaluacion-id="evaluacionId"
      :requisito-id="requisito.id"
      :codigo="requisito.codigo"
      :evidencias="respuesta.evidencias || []"
      etiqueta="Evidencias fotográficas del hallazgo y del cierre"
      @cambio="(l) => emit('evidencias', l)"
    />
  </article>
</template>

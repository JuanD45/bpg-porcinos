<script setup lang="ts">
import { computed, ref } from 'vue';
import { api, urlArchivo } from '../api';
import { puede } from '../auth';
import { fecha } from '../lib/formato';
import { prepararArchivo } from '../lib/imagen';
import type { Evidencia } from '../types';
import { avisar, avisarError, confirmar } from '../ui';

const props = defineProps<{
  evaluacionId: string;
  requisitoId: string;
  codigo: string;
  evidencias: Evidencia[];
  etiqueta: string;
}>();
const emit = defineEmits<{ cambio: [evidencias: Evidencia[]] }>();

const subiendo = ref(false);
const viendo = ref<number | null>(null);
const input = ref<HTMLInputElement | null>(null);
const puedeSubir = computed(() => puede.evaluar());
const actual = computed(() => (viendo.value === null ? null : props.evidencias[viendo.value]));
const esPdf = (e: Evidencia) => e.contentType === 'application/pdf';

async function subir(ev: Event) {
  const archivos = [...((ev.target as HTMLInputElement).files || [])];
  (ev.target as HTMLInputElement).value = '';
  if (!archivos.length) return;
  subiendo.value = true;
  try {
    const form = new FormData();
    for (const a of archivos) form.append('archivos', await prepararArchivo(a));
    const nuevas = await api<Evidencia[]>(
      `/evaluaciones/${props.evaluacionId}/respuestas/${props.requisitoId}/evidencias`,
      { method: 'POST', form },
    );
    emit('cambio', [...props.evidencias, ...nuevas]);
    avisar(nuevas.length === 1 ? 'Evidencia adjuntada.' : `${nuevas.length} evidencias adjuntadas.`);
  } catch (e) {
    avisarError(e);
  } finally {
    subiendo.value = false;
  }
}

async function eliminar() {
  const e = actual.value;
  if (!e) return;
  const ok = await confirmar(
    'Eliminar evidencia',
    `Se eliminará "${e.nombreArchivo}" del ítem ${props.codigo}. Esta acción no se puede deshacer.`,
  );
  if (!ok) return;
  try {
    await api(`/evidencias/${e.id}`, { method: 'DELETE' });
    viendo.value = null;
    emit('cambio', props.evidencias.filter((x) => x.id !== e.id));
    avisar('Evidencia eliminada.');
  } catch (err) {
    avisarError(err);
  }
}
</script>

<template>
  <div v-if="evidencias.length || puedeSubir" class="side" style="gap: 4px">
    <span class="photolabel">{{ etiqueta }} ({{ evidencias.length }})</span>
    <div class="photos">
      <button
        v-for="(e, i) in evidencias"
        :key="e.id"
        type="button"
        class="thumb"
        :aria-label="`Ver evidencia ${i + 1}: ${e.nombreArchivo}`"
        @click="viendo = i"
      >
        <template v-if="esPdf(e)">PDF</template>
        <img v-else :src="urlArchivo(e.url)" alt="" loading="lazy" />
      </button>
      <template v-if="puedeSubir">
        <button type="button" class="addphoto" :disabled="subiendo" @click="input?.click()">
          <b>{{ subiendo ? '…' : '+' }}</b>{{ subiendo ? 'Subiendo' : 'Foto / PDF' }}
        </button>
        <input ref="input" type="file" accept="image/*,application/pdf" multiple hidden @change="subir" />
      </template>
    </div>
  </div>

  <div v-if="actual" class="scrim" @mousedown.self="viendo = null">
    <div class="modal viewer" role="dialog" aria-modal="true" aria-labelledby="visor-titulo" style="width: min(900px, 100%)">
      <div class="spread">
        <div>
          <div class="eyebrow">Ítem {{ codigo }} · Evidencia {{ viendo + 1 }} de {{ evidencias.length }}</div>
          <h2 id="visor-titulo">{{ actual.nombreArchivo }}</h2>
          <div class="muted" style="font-size: 13px">Adjuntada el {{ fecha(actual.creadoEn) }}</div>
        </div>
        <button class="btn" type="button" @click="viendo = null">Cerrar</button>
      </div>
      <p v-if="esPdf(actual)" style="margin: 0">
        Documento PDF. <a :href="urlArchivo(actual.url)" target="_blank" rel="noopener">Abrir el PDF</a>
      </p>
      <img v-else :src="urlArchivo(actual.url)" :alt="`Evidencia del ítem ${codigo}`" />
      <div class="row" style="justify-content: space-between">
        <div class="row">
          <button v-if="viendo > 0" class="btn small" type="button" @click="viendo--">← Anterior</button>
          <button v-if="viendo < evidencias.length - 1" class="btn small" type="button" @click="viendo++">Siguiente →</button>
          <a class="btn small" :href="urlArchivo(actual.url)" target="_blank" rel="noopener">Ver en tamaño completo</a>
        </div>
        <button v-if="puede.eliminarEvidencia(actual.subidoPorId)" class="btn small danger" type="button" @click="eliminar">
          Eliminar evidencia
        </button>
      </div>
    </div>
  </div>
</template>

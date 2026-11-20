<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { puede } from '../auth';
import EvaluacionPanel from '../components/EvaluacionPanel.vue';
import ModalDialog from '../components/ModalDialog.vue';
import GranjaForm from '../components/GranjaForm.vue';
import type { Resumen } from '../lib/cumplimiento';
import { fecha, hoyISO, pct } from '../lib/formato';
import type { Evaluacion, Granja, Requisito, Umbrales } from '../types';
import { avisar, avisarError, confirmar } from '../ui';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();

const granja = ref<Granja | null>(null);
const evaluaciones = ref<Evaluacion[]>([]);
const requisitos = ref<Requisito[]>([]);
const umbrales = ref<Umbrales>({ F: 1, My: 0.8, Mn: 0.6 });
const cargando = ref(true);
const editandoGranja = ref(false);

const seleccionadaId = computed(() => {
  const q = route.query.ev;
  return (typeof q === 'string' && evaluaciones.value.some((e) => e.id === q) ? q : evaluaciones.value[0]?.id) || null;
});
const seleccionada = computed(() => evaluaciones.value.find((e) => e.id === seleccionadaId.value) || null);

async function cargar() {
  cargando.value = true;
  try {
    const [g, evs, reqs, umb] = await Promise.all([
      api<Granja>(`/granjas/${props.id}`),
      api<Evaluacion[]>(`/granjas/${props.id}/evaluaciones`),
      api<Requisito[]>('/requisitos?activos=true'),
      api<Umbrales>('/configuracion/umbrales'),
    ]);
    granja.value = g;
    evaluaciones.value = evs;
    requisitos.value = reqs;
    umbrales.value = umb;
  } catch (e) {
    avisarError(e);
    router.replace({ name: 'granjas' });
  } finally {
    cargando.value = false;
  }
}
watch(() => props.id, cargar, { immediate: true });

function elegir(id: string) {
  router.replace({ query: { ev: id } });
}

/** Mantiene al día el porcentaje del selector de evaluaciones mientras se califica. */
function actualizarResumen(r: Resumen) {
  const e = seleccionada.value;
  if (e) e.resumen = r;
}

function granjaGuardada(g: Granja) {
  granja.value = g;
  editandoGranja.value = false;
}

async function eliminarGranja() {
  const g = granja.value;
  const ok = await confirmar(
    'Eliminar granja',
    `Se eliminará "${g.nombre}" con sus ${evaluaciones.value.length} evaluación(es), respuestas y evidencias. Esta acción no se puede deshacer.`,
  );
  if (!ok) return;
  try {
    await api(`/granjas/${g.id}`, { method: 'DELETE' });
    avisar('Granja eliminada.');
    router.replace({ name: 'granjas' });
  } catch (e) {
    avisarError(e);
  }
}

// ----- Crear / editar evaluación -----
const formEval = reactive({ abierto: false, id: '', fecha: '', evaluador: '', error: '', ocupado: false });

function abrirEval(e?: Evaluacion) {
  Object.assign(formEval, {
    abierto: true,
    id: e?.id || '',
    fecha: e?.fecha || hoyISO(),
    evaluador: e?.evaluador || '',
    error: '',
    ocupado: false,
  });
}

async function guardarEval() {
  if (!formEval.fecha) {
    formEval.error = 'Elige la fecha de la evaluación.';
    return;
  }
  formEval.ocupado = true;
  try {
    const body = { fecha: formEval.fecha, evaluador: formEval.evaluador };
    if (formEval.id) {
      const e = await api<Evaluacion>(`/evaluaciones/${formEval.id}`, { method: 'PATCH', body });
      const i = evaluaciones.value.findIndex((x) => x.id === e.id);
      evaluaciones.value[i] = { ...evaluaciones.value[i], ...e };
    } else {
      const e = await api<Evaluacion>(`/granjas/${props.id}/evaluaciones`, { method: 'POST', body });
      evaluaciones.value.unshift(e);
      elegir(e.id);
    }
    evaluaciones.value.sort((a, b) => b.fecha.localeCompare(a.fecha));
    formEval.abierto = false;
  } catch (e) {
    formEval.error = e instanceof Error ? e.message : 'No se pudo guardar.';
  } finally {
    formEval.ocupado = false;
  }
}

async function eliminarEval() {
  const e = seleccionada.value;
  const ok = await confirmar(
    'Eliminar evaluación',
    `Se eliminará la evaluación del ${fecha(e.fecha)} con sus respuestas, plan de acción y evidencias.`,
  );
  if (!ok) return;
  try {
    await api(`/evaluaciones/${e.id}`, { method: 'DELETE' });
    evaluaciones.value = evaluaciones.value.filter((x) => x.id !== e.id);
    router.replace({ query: {} });
    avisar('Evaluación eliminada.');
  } catch (err) {
    avisarError(err);
  }
}
</script>

<template>
  <main>
    <div><RouterLink :to="{ name: 'granjas' }" class="linkbtn">← Todas las granjas</RouterLink></div>
    <div v-if="cargando" class="loading">Cargando granja…</div>
    <template v-else-if="granja">
      <section class="panel" style="display: flex; flex-direction: column; gap: 14px">
        <div class="spread">
          <div>
            <div class="eyebrow">Identificación del predio</div>
            <h1>{{ granja.nombre }}</h1>
          </div>
          <div class="row">
            <button v-if="puede.evaluar()" class="btn small" type="button" @click="editandoGranja = true">Editar datos</button>
            <button v-if="puede.eliminarGranja()" class="btn small danger" type="button" @click="eliminarGranja">
              Eliminar granja
            </button>
          </div>
        </div>
        <dl class="dl">
          <div><dt>Municipio / Departamento</dt><dd>{{ granja.municipio || '—' }}</dd></div>
          <div><dt>Registro sanitario (RSPP / ISPP)</dt><dd>{{ granja.registroSanitario || '—' }}</dd></div>
          <div><dt>Autorización sanitaria (ASI)</dt><dd>{{ granja.asi || '—' }}</dd></div>
          <div><dt>Médico veterinario responsable</dt><dd>{{ granja.mvz || '—' }}</dd></div>
          <div><dt>Tipo de explotación / genética</dt><dd>{{ granja.tipo || '—' }}</dd></div>
        </dl>
      </section>

      <section style="display: flex; flex-direction: column; gap: 10px">
        <div class="spread">
          <h2>Evaluaciones</h2>
          <button v-if="puede.evaluar()" class="btn primary" type="button" @click="abrirEval()">+ Nueva evaluación</button>
        </div>
        <div v-if="evaluaciones.length" class="evals" role="group" aria-label="Evaluaciones de la granja">
          <button
            v-for="e in evaluaciones"
            :key="e.id"
            type="button"
            class="evtab"
            :aria-pressed="e.id === seleccionadaId"
            @click="elegir(e.id)"
          >
            <span>{{ fecha(e.fecha) }}</span>
            <span v-if="e.resumen" class="muted num">{{ pct(e.resumen.total.pct) }}</span>
          </button>
        </div>
        <div v-else class="empty">Esta granja no tiene evaluaciones. Crea una para aplicar la lista de chequeo.</div>
      </section>

      <EvaluacionPanel
        v-if="seleccionada"
        :key="seleccionada.id"
        :evaluacion="seleccionada"
        :granja="granja"
        :requisitos="requisitos"
        :umbrales="umbrales"
        @resumen="actualizarResumen"
        @editar="abrirEval(seleccionada)"
        @eliminar="eliminarEval"
      />
    </template>

    <GranjaForm
      v-if="editandoGranja && granja"
      :granja="granja"
      @cerrar="editandoGranja = false"
      @guardada="granjaGuardada"
    />

    <ModalDialog
      v-if="formEval.abierto"
      :titulo="formEval.id ? 'Editar evaluación' : 'Nueva evaluación'"
      :boton="formEval.id ? 'Guardar' : 'Crear evaluación'"
      :error="formEval.error"
      :ocupado="formEval.ocupado"
      @enviar="guardarEval"
      @cerrar="formEval.abierto = false"
    >
      <div class="fgrid">
        <div class="field">
          <label for="ev-fecha">Fecha de evaluación</label>
          <input id="ev-fecha" v-model="formEval.fecha" type="date" required />
        </div>
        <div class="field">
          <label for="ev-evaluador">Evaluador / auditor interno</label>
          <input id="ev-evaluador" v-model="formEval.evaluador" type="text" />
        </div>
      </div>
      <p v-if="!formEval.id" class="muted" style="margin: 0; font-size: 13px">
        Se aplicarán los {{ requisitos.length }} requisitos activos del catálogo.
      </p>
    </ModalDialog>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { api } from '../api';
import { puede } from '../auth';
import { calcularResumen, type Resumen } from '../lib/cumplimiento';
import { descargarCSV } from '../lib/csv';
import { cop, fecha, pct } from '../lib/formato';
import { dictamen, prioridad } from '../lib/prioridad';
import { NIVELES, NOMBRE_NIVEL, type Evaluacion, type Evidencia, type Granja, type Requisito, type Respuesta, type Umbrales } from '../types';
import { avisarError } from '../ui';
import BarraNivel from './BarraNivel.vue';
import ChecklistItem from './ChecklistItem.vue';
import PlanItem from './PlanItem.vue';

const props = defineProps<{
  evaluacion: Evaluacion;
  granja: Granja;
  requisitos: Requisito[]; // solo activos, ordenados
  umbrales: Umbrales;
}>();
const emit = defineEmits<{ resumen: [r: Resumen]; editar: []; eliminar: [] }>();

const cargando = ref(true);
const respuestas = reactive(new Map<string, Respuesta>());
const pestana = ref<'check' | 'plan'>('check');
const filtros = reactive({ q: '', nivel: '', estado: '', capitulo: '' });
const editable = computed(() => puede.evaluar());

async function cargar() {
  cargando.value = true;
  respuestas.clear();
  try {
    const d = await api<{ respuestas: Respuesta[] }>(`/evaluaciones/${props.evaluacion.id}`);
    for (const r of d.respuestas) respuestas.set(r.requisitoId, r);
  } catch (e) {
    avisarError(e);
  } finally {
    cargando.value = false;
  }
}
watch(() => props.evaluacion.id, cargar, { immediate: true });

const resumen = computed(() =>
  calcularResumen(props.requisitos, (id) => respuestas.get(id)?.estado, props.umbrales),
);
const dict = computed(() => dictamen(resumen.value));
watch(resumen, (r) => emit('resumen', r));

const capitulos = computed(() => {
  const orden: string[] = [];
  const mapa = new Map<string, Requisito[]>();
  for (const r of props.requisitos) {
    if (!mapa.has(r.capitulo)) {
      mapa.set(r.capitulo, []);
      orden.push(r.capitulo);
    }
    mapa.get(r.capitulo)!.push(r);
  }
  return orden.map((nombre) => ({ nombre, items: mapa.get(nombre)! }));
});

const visibles = computed(() => {
  const q = filtros.q.trim().toLowerCase();
  return capitulos.value
    .filter((c) => !filtros.capitulo || c.nombre === filtros.capitulo)
    .map((c) => ({
      ...c,
      calificados: c.items.filter((r) => respuestas.get(r.id)?.estado).length,
      visibles: c.items.filter((r) => {
        const rs = respuestas.get(r.id);
        const est = rs?.estado || 'PENDIENTE';
        if (filtros.nivel && r.nivel !== filtros.nivel) return false;
        if (filtros.estado && est !== filtros.estado) return false;
        if (q && ![r.codigo, r.requisito, r.evidencia, r.referencia, rs?.observaciones].join(' ').toLowerCase().includes(q))
          return false;
        return true;
      }),
    }))
    .filter((c) => c.visibles.length);
});

const plan = computed(() =>
  props.requisitos
    .filter((r) => respuestas.get(r.id)?.estado === 'NO CUMPLE')
    .map((r) => ({ r, rs: respuestas.get(r.id)!, pr: prioridad(r.nivel, 'NO CUMPLE')! }))
    .sort((a, b) => a.pr.orden - b.pr.orden),
);
const totales = computed(() => ({
  inversion: plan.value.reduce((s, x) => s + (Number(x.rs.inversion) || 0), 0),
  cerradas: plan.value.filter((x) => x.rs.avance === 'Cerrado').length,
  fAbiertas: plan.value.filter((x) => x.r.nivel === 'F' && x.rs.avance !== 'Cerrado').length,
}));

function vacia(requisitoId: string): Respuesta {
  return {
    evaluacionId: props.evaluacion.id,
    requisitoId,
    estado: null,
    observaciones: '',
    accion: '',
    evidenciaCierre: '',
    responsable: '',
    fechaCompromiso: null,
    inversion: null,
    avance: null,
    evidencias: [],
  };
}

/** Las escrituras de un mismo requisito van en fila para que no se pisen. */
const colas = new Map<string, Promise<unknown>>();
function guardar(requisitoId: string, cambios: Partial<Respuesta>) {
  const actual = respuestas.get(requisitoId) || vacia(requisitoId);
  respuestas.set(requisitoId, { ...actual, ...cambios });
  const anterior = colas.get(requisitoId) || Promise.resolve();
  const siguiente = anterior.then(async () => {
    try {
      const r = await api<Respuesta>(`/evaluaciones/${props.evaluacion.id}/respuestas/${requisitoId}`, {
        method: 'PUT',
        body: cambios,
      });
      const local = respuestas.get(requisitoId);
      if (local && !local.id) respuestas.set(requisitoId, { ...local, id: r.id });
    } catch (e) {
      avisarError(e);
      await cargar();
    }
  });
  colas.set(requisitoId, siguiente);
}

function evidencias(requisitoId: string, lista: Evidencia[]) {
  const actual = respuestas.get(requisitoId) || vacia(requisitoId);
  respuestas.set(requisitoId, { ...actual, evidencias: lista });
}

function irAPlan() {
  pestana.value = 'plan';
  document.querySelector('.tabs')?.scrollIntoView({ block: 'start' });
}

function exportar() {
  descargarCSV(props.granja, props.evaluacion, props.requisitos, respuestas);
}
</script>

<template>
  <section style="display: flex; flex-direction: column; gap: 14px">
    <div class="spread">
      <div class="muted" style="font-size: 14px">
        Evaluación del {{ fecha(evaluacion.fecha) }}<template v-if="evaluacion.evaluador"> · Evaluador: {{ evaluacion.evaluador }}</template>
      </div>
      <div class="row">
        <button class="btn small" type="button" :disabled="cargando" @click="exportar">Descargar CSV</button>
        <template v-if="editable">
          <button class="btn small" type="button" @click="emit('editar')">Editar</button>
          <button class="btn small danger" type="button" @click="emit('eliminar')">Eliminar evaluación</button>
        </template>
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando evaluación…</div>
    <template v-else>
      <div class="dictamen" :class="dict.clase">
        <div class="pct num">{{ pct(resumen.total.pct) }}</div>
        <div class="txt">
          <b>{{ dict.titulo }}</b><span class="muted">{{ dict.detalle }}</span>
        </div>
        <div class="row muted num" style="font-size: 13px; gap: 14px">
          <span>{{ resumen.total.cumple }} cumple</span>
          <span>{{ resumen.total.noCumple }} no cumple</span>
          <span>{{ resumen.total.noAplica }} no aplica</span>
          <span>{{ resumen.pendientes }} pendientes</span>
        </div>
      </div>

      <div class="cols">
        <div class="panel">
          <h3 style="margin-bottom: 8px">Cumplimiento por nivel de criticidad</h3>
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Nivel</th><th class="r">Ítems</th><th class="r">Cumple</th><th class="r">No cumple</th>
                  <th class="r">N/A</th><th class="r">% real</th><th class="r">Meta</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(n, i) in resumen.niveles" :key="n.nivel">
                  <td>
                    <span class="chip" :class="`lv-${n.nivel}`">{{ n.nivel }}</span> {{ NIVELES[i].nombre }}
                    <div class="muted" style="font-size: 12px">{{ NIVELES[i].desc }}</div>
                  </td>
                  <td class="r num">{{ n.total }}</td>
                  <td class="r num">{{ n.cumple }}</td>
                  <td class="r num">{{ n.noCumple }}</td>
                  <td class="r num">{{ n.noAplica }}</td>
                  <td class="r num"><b>{{ pct(n.pct) }}</b></td>
                  <td class="r num">{{ pct(n.meta) }}</td>
                  <td>
                    <span class="chip" :class="n.cumpleMeta ? 'st-ok' : 'st-bad'">{{ n.cumpleMeta ? 'Cumple meta' : 'No cumple' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="panel">
          <h3 style="margin-bottom: 6px">Por capítulo normativo</h3>
          <div v-for="c in resumen.capitulos" :key="c.capitulo" class="chap">
            <span>{{ c.capitulo }}</span>
            <span class="num" style="text-align: right; font-weight: 600">{{ pct(c.pct) }}</span>
            <BarraNivel :pct="c.pct" />
          </div>
        </div>
      </div>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="pestana === 'check'" @click="pestana = 'check'">
          Lista de chequeo ({{ requisitos.length }})
        </button>
        <button type="button" role="tab" :aria-selected="pestana === 'plan'" @click="pestana = 'plan'">
          Plan de acción ({{ plan.length }})
        </button>
      </div>

      <template v-if="pestana === 'check'">
        <div class="filters">
          <input v-model="filtros.q" type="search" placeholder="Buscar requisito, evidencia o referencia" aria-label="Buscar" />
          <select v-model="filtros.nivel" aria-label="Nivel">
            <option value="">Todos los niveles</option>
            <option v-for="n in NIVELES" :key="n.k" :value="n.k">{{ n.k }} · {{ NOMBRE_NIVEL[n.k] }}</option>
          </select>
          <select v-model="filtros.estado" aria-label="Estado">
            <option value="">Todos los estados</option>
            <option v-for="e in ['CUMPLE', 'NO CUMPLE', 'NO APLICA', 'PENDIENTE']" :key="e" :value="e">{{ e }}</option>
          </select>
          <select v-model="filtros.capitulo" aria-label="Capítulo">
            <option value="">Todos los capítulos</option>
            <option v-for="c in capitulos" :key="c.nombre" :value="c.nombre">{{ c.nombre }}</option>
          </select>
        </div>
        <div v-if="!requisitos.length" class="empty">No hay requisitos activos. Agrégalos en la sección Requisitos.</div>
        <div v-else-if="!visibles.length" class="empty">Ningún ítem coincide con los filtros.</div>
        <template v-for="c in visibles" :key="c.nombre">
          <div class="chaphead">
            <h3>{{ c.nombre }}</h3>
            <span class="muted num" style="font-size: 13px">{{ c.calificados }} de {{ c.items.length }} calificados</span>
          </div>
          <ChecklistItem
            v-for="r in c.visibles"
            :key="r.id"
            :requisito="r"
            :respuesta="respuestas.get(r.id)"
            :evaluacion-id="evaluacion.id"
            :editable="editable"
            @guardar="(cambios) => guardar(r.id, cambios)"
            @evidencias="(l) => evidencias(r.id, l)"
            @ver-plan="irAPlan"
          />
        </template>
      </template>

      <template v-else>
        <div v-if="!plan.length" class="empty">
          No hay no conformidades en esta evaluación. Cuando marques un ítem como "No cumple", aparecerá aquí para definir su
          acción correctiva.
        </div>
        <template v-else>
          <div class="totals">
            <div><span class="muted" style="font-size: 12px">Acciones cerradas</span><b class="num">{{ totales.cerradas }} de {{ plan.length }}</b></div>
            <div>
              <span class="muted" style="font-size: 12px">Fundamentales abiertas</span>
              <b class="num" :style="{ color: totales.fAbiertas ? 'var(--bad)' : 'var(--ok)' }">{{ totales.fAbiertas }}</b>
            </div>
            <div><span class="muted" style="font-size: 12px">Presupuesto estimado de cierre</span><b class="num">{{ cop(totales.inversion) }}</b></div>
          </div>
          <p class="muted" style="margin: 0; font-size: 13px">
            Si la visita oficial del ICA queda aplazada hay hasta 3 meses para subsanar. Se recomienda cerrar el 100 % de los
            ítems F antes de radicar.
          </p>
          <PlanItem
            v-for="x in plan"
            :key="x.r.id"
            :requisito="x.r"
            :respuesta="x.rs"
            :evaluacion-id="evaluacion.id"
            :editable="editable"
            @guardar="(cambios) => guardar(x.r.id, cambios)"
            @evidencias="(l) => evidencias(x.r.id, l)"
          />
        </template>
      </template>
    </template>
  </section>
</template>

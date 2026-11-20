<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { puede } from '../auth';
import BarraNivel from '../components/BarraNivel.vue';
import GranjaForm from '../components/GranjaForm.vue';
import { fecha, pct } from '../lib/formato';
import { clasePill, dictamen } from '../lib/prioridad';
import type { Granja } from '../types';
import { avisarError } from '../ui';

const router = useRouter();
const granjas = ref<Granja[]>([]);
const cargando = ref(true);
const creando = ref(false);

async function cargar() {
  try {
    granjas.value = await api<Granja[]>('/granjas');
  } catch (e) {
    avisarError(e);
  } finally {
    cargando.value = false;
  }
}
onMounted(cargar);

function creada(g: Granja) {
  creando.value = false;
  router.push({ name: 'granja', params: { id: g.id } });
}
</script>

<template>
  <main>
    <div class="spread">
      <div>
        <h1>Granjas</h1>
        <p class="muted" style="margin: 4px 0 0">Estado de cada granja frente a la certificación BPG según su última evaluación.</p>
      </div>
      <button v-if="puede.evaluar()" class="btn primary" type="button" @click="creando = true">+ Nueva granja</button>
    </div>

    <div v-if="cargando" class="loading">Cargando granjas…</div>
    <div v-else-if="!granjas.length" class="empty">Aún no hay granjas registradas. Crea la primera para empezar a evaluar.</div>
    <div v-else class="grid">
      <RouterLink
        v-for="g in granjas"
        :key="g.id"
        :to="{ name: 'granja', params: { id: g.id } }"
        class="farm"
        style="text-decoration: none"
      >
        <div>
          <h2>{{ g.nombre }}</h2>
          <div class="muted" style="font-size: 13px">
            {{ g.municipio }}<template v-if="g.registroSanitario"> · {{ g.registroSanitario }}</template>
          </div>
        </div>
        <template v-if="g.ultimaEvaluacion">
          <div class="row" style="justify-content: space-between">
            <span class="big num">{{ pct(g.ultimaEvaluacion.resumen.total.pct) }}</span>
            <span class="chip" :class="clasePill(dictamen(g.ultimaEvaluacion.resumen))">
              {{ dictamen(g.ultimaEvaluacion.resumen).titulo }}
            </span>
          </div>
          <div class="levels-mini">
            <div v-for="n in g.ultimaEvaluacion.resumen.niveles" :key="n.nivel" class="lvm">
              <span>{{ n.nivel }} · <span class="num">{{ pct(n.pct) }}</span></span>
              <BarraNivel :pct="n.pct" :meta="n.meta" />
            </div>
          </div>
          <div class="muted" style="font-size: 13px">
            Última evaluación: {{ fecha(g.ultimaEvaluacion.fecha) }} ·
            {{ g.ultimaEvaluacion.resumen.total.noCumple }} no conformidades
            <span v-if="g.ultimaEvaluacion.resumen.pendientes">· {{ g.ultimaEvaluacion.resumen.pendientes }} pendientes</span>
          </div>
        </template>
        <div v-else class="muted" style="font-size: 14px">Sin evaluaciones todavía.</div>
      </RouterLink>
    </div>

    <GranjaForm v-if="creando" @cerrar="creando = false" @guardada="creada" />
  </main>
</template>

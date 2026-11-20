<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import { puede } from '../auth';
import ModalDialog from '../components/ModalDialog.vue';
import { NIVELES, NOMBRE_NIVEL, type Nivel, type Requisito, type Umbrales } from '../types';
import { avisar, avisarError, confirmar } from '../ui';

const requisitos = ref<Requisito[]>([]);
const umbrales = reactive<Umbrales>({ F: 1, My: 0.8, Mn: 0.6 });
const cargando = ref(true);
const filtros = reactive({ q: '', capitulo: '' });
const admin = computed(() => puede.editarCatalogo());

async function cargar() {
  try {
    const [reqs, umb] = await Promise.all([
      api<Requisito[]>('/requisitos'),
      api<Umbrales>('/configuracion/umbrales'),
    ]);
    requisitos.value = reqs;
    Object.assign(umbrales, umb);
  } catch (e) {
    avisarError(e);
  } finally {
    cargando.value = false;
  }
}
onMounted(cargar);

const capitulos = computed(() => {
  const orden: string[] = [];
  const mapa = new Map<string, Requisito[]>();
  for (const r of requisitos.value) {
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
      conteo: (n: Nivel) => c.items.filter((r) => r.nivel === n).length,
      visibles: c.items.filter(
        (r) => !q || [r.codigo, r.requisito, r.evidencia, r.referencia].join(' ').toLowerCase().includes(q),
      ),
    }))
    .filter((c) => c.visibles.length);
});
const activos = computed(() => requisitos.value.filter((r) => r.activo).length);

async function guardarUmbral(n: Nivel, e: Event) {
  const v = Math.max(0, Math.min(100, Number((e.target as HTMLInputElement).value))) / 100;
  if (!Number.isFinite(v) || v === umbrales[n]) return;
  try {
    Object.assign(umbrales, await api<Umbrales>('/configuracion/umbrales', { method: 'PUT', body: { ...umbrales, [n]: v } }));
    avisar('Meta actualizada.');
  } catch (err) {
    avisarError(err);
  }
}

// ----- Formulario -----
const vacio = () => ({ id: '', codigo: '', capitulo: '', nivel: 'My' as Nivel, requisito: '', evidencia: '', referencia: '', activo: true });
const form = reactive({ abierto: false, error: '', ocupado: false, datos: vacio() });

function abrir(r?: Requisito) {
  form.datos = r ? { ...r } : vacio();
  form.error = '';
  form.abierto = true;
}

async function guardar() {
  const d = form.datos;
  if (!d.codigo.trim() || !d.capitulo.trim() || !d.requisito.trim()) {
    form.error = 'Completa ítem, capítulo y requisito.';
    return;
  }
  form.ocupado = true;
  form.error = '';
  const { id, ...body } = d;
  try {
    if (id) {
      const r = await api<Requisito>(`/requisitos/${id}`, { method: 'PATCH', body });
      requisitos.value = requisitos.value.map((x) => (x.id === id ? r : x));
      avisar('Requisito actualizado.');
    } else {
      await api<Requisito>('/requisitos', { method: 'POST', body });
      requisitos.value = await api<Requisito[]>('/requisitos');
      avisar('Requisito agregado al catálogo.');
    }
    form.abierto = false;
  } catch (e) {
    form.error = e instanceof Error ? e.message : 'No se pudo guardar.';
  } finally {
    form.ocupado = false;
  }
}

async function eliminar(r: Requisito) {
  const ok = await confirmar(
    'Eliminar requisito',
    `Se eliminará el ítem ${r.codigo} del catálogo junto con sus respuestas y evidencias en todas las evaluaciones. Si solo quieres dejar de aplicarlo, edítalo y desmarca "Activo".`,
  );
  if (!ok) return;
  try {
    await api(`/requisitos/${r.id}`, { method: 'DELETE' });
    requisitos.value = requisitos.value.filter((x) => x.id !== r.id);
    avisar('Requisito eliminado.');
  } catch (e) {
    avisarError(e);
  }
}
</script>

<template>
  <main>
    <div class="spread">
      <div>
        <h1>Requisitos de certificación</h1>
        <p class="muted" style="margin: 4px 0 0">Catálogo que se aplica en cada evaluación. Los cambios se reflejan en todas las granjas.</p>
      </div>
      <button v-if="admin" class="btn primary" type="button" @click="abrir()">+ Agregar requisito</button>
    </div>

    <section class="panel" style="display: flex; flex-direction: column; gap: 10px">
      <h3>Meta mínima de cumplimiento por nivel</h3>
      <div class="thr">
        <div v-for="n in NIVELES" :key="n.k" class="field">
          <label :for="`thr-${n.k}`">{{ n.k }} · {{ n.nombre }} (%)</label>
          <input
            :id="`thr-${n.k}`"
            type="number"
            min="0"
            max="100"
            step="1"
            :value="Math.round(umbrales[n.k] * 100)"
            :disabled="!admin"
            @change="guardarUmbral(n.k, $event)"
          />
        </div>
      </div>
      <p class="muted" style="margin: 0; font-size: 13px">
        Porcentaje = ítems que cumplen ÷ (total − no aplica). La granja es certificable cuando los tres niveles alcanzan su meta.
      </p>
    </section>

    <div class="filters">
      <input v-model="filtros.q" type="search" placeholder="Buscar en el catálogo" aria-label="Buscar en el catálogo" />
      <select v-model="filtros.capitulo" aria-label="Capítulo">
        <option value="">Todos los capítulos</option>
        <option v-for="c in capitulos" :key="c.nombre" :value="c.nombre">{{ c.nombre }}</option>
      </select>
      <span class="muted" style="align-self: center; font-size: 13px">{{ activos }} activos de {{ requisitos.length }}</span>
    </div>

    <div v-if="cargando" class="loading">Cargando requisitos…</div>
    <div v-else-if="!requisitos.length" class="empty">El catálogo está vacío.</div>
    <section v-for="c in visibles" :key="c.nombre" class="panel" style="padding: 0">
      <div class="spread" style="padding: 12px 16px">
        <h3>{{ c.nombre }}</h3>
        <span class="muted num" style="font-size: 13px">F {{ c.conteo('F') }} · My {{ c.conteo('My') }} · Mn {{ c.conteo('Mn') }}</span>
      </div>
      <div class="tablewrap">
        <table class="cat">
          <thead>
            <tr><th>Ítem</th><th>Nivel</th><th>Requisito técnico</th><th>Evidencia exigida</th><th>Referencia legal</th><th v-if="admin"></th></tr>
          </thead>
          <tbody>
            <tr v-for="r in c.visibles" :key="r.id" :class="{ off: !r.activo }">
              <td class="mono">{{ r.codigo }}</td>
              <td><span class="chip" :class="`lv-${r.nivel}`">{{ r.nivel }}</span></td>
              <td class="req">{{ r.requisito }} <span v-if="!r.activo" class="chip st-na">Inactivo</span></td>
              <td class="ev">{{ r.evidencia }}</td>
              <td style="min-width: 150px; font-size: 13px">{{ r.referencia }}</td>
              <td v-if="admin" style="white-space: nowrap">
                <button class="btn small" type="button" @click="abrir(r)">Editar</button>
                {{ ' ' }}
                <button class="btn small danger" type="button" :aria-label="`Eliminar requisito ${r.codigo}`" @click="eliminar(r)">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ModalDialog
      v-if="form.abierto"
      :titulo="form.datos.id ? 'Editar requisito' : 'Agregar requisito'"
      :boton="form.datos.id ? 'Guardar' : 'Agregar'"
      :error="form.error"
      :ocupado="form.ocupado"
      @enviar="guardar"
      @cerrar="form.abierto = false"
    >
      <div class="fgrid">
        <div class="field">
          <label for="r-codigo">Ítem (ej. 3.9)</label>
          <input id="r-codigo" v-model="form.datos.codigo" type="text" required />
        </div>
        <div class="field">
          <label for="r-nivel">Nivel de criticidad</label>
          <select id="r-nivel" v-model="form.datos.nivel">
            <option v-for="n in NIVELES" :key="n.k" :value="n.k">{{ n.k }} · {{ NOMBRE_NIVEL[n.k] }} ({{ n.desc.toLowerCase() }})</option>
          </select>
        </div>
        <div class="field wide">
          <label for="r-capitulo">Capítulo normativo</label>
          <input id="r-capitulo" v-model="form.datos.capitulo" type="text" list="lista-capitulos" required />
          <datalist id="lista-capitulos">
            <option v-for="c in capitulos" :key="c.nombre" :value="c.nombre" />
          </datalist>
        </div>
        <div class="field wide">
          <label for="r-requisito">Requisito técnico a verificar en granja</label>
          <textarea id="r-requisito" v-model="form.datos.requisito" required></textarea>
        </div>
        <div class="field wide">
          <label for="r-evidencia">Evidencia / soporte exigido por el auditor ICA</label>
          <textarea id="r-evidencia" v-model="form.datos.evidencia"></textarea>
        </div>
        <div class="field wide">
          <label for="r-referencia">Referencia legal</label>
          <input id="r-referencia" v-model="form.datos.referencia" type="text" />
        </div>
        <label class="row field wide" style="flex-direction: row">
          <input v-model="form.datos.activo" type="checkbox" style="width: auto" /> Activo (se aplica en las evaluaciones)
        </label>
      </div>
    </ModalDialog>
  </main>
</template>

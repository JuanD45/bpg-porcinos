<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import { sesion } from '../auth';
import ModalDialog from '../components/ModalDialog.vue';
import { fecha } from '../lib/formato';
import { NOMBRE_ROL, type Rol, type Usuario } from '../types';
import { avisar, avisarError } from '../ui';

const usuarios = ref<Usuario[]>([]);
const cargando = ref(true);
const ROLES: { k: Rol; desc: string }[] = [
  { k: 'admin', desc: 'Todo, incluido el catálogo de requisitos y los usuarios' },
  { k: 'auditor', desc: 'Crea granjas y evaluaciones, califica y sube evidencias' },
  { k: 'lector', desc: 'Solo consulta' },
];

async function cargar() {
  try {
    usuarios.value = await api<Usuario[]>('/usuarios');
  } catch (e) {
    avisarError(e);
  } finally {
    cargando.value = false;
  }
}
onMounted(cargar);

const form = reactive({
  abierto: false,
  error: '',
  ocupado: false,
  id: '',
  email: '',
  nombre: '',
  rol: 'auditor' as Rol,
  password: '',
  activo: true,
});

function abrir(u?: Usuario) {
  Object.assign(form, {
    abierto: true,
    error: '',
    ocupado: false,
    id: u?.id || '',
    email: u?.email || '',
    nombre: u?.nombre || '',
    rol: u?.rol || 'auditor',
    password: '',
    activo: u?.activo ?? true,
  });
}

async function guardar() {
  if (!form.nombre.trim() || (!form.id && (!form.email.trim() || form.password.length < 8))) {
    form.error = form.id
      ? 'Escribe el nombre.'
      : 'Completa nombre y correo, y una contraseña de al menos 8 caracteres.';
    return;
  }
  form.ocupado = true;
  form.error = '';
  try {
    if (form.id) {
      const body: Record<string, unknown> = { nombre: form.nombre, rol: form.rol, activo: form.activo };
      if (form.password) body.password = form.password;
      await api(`/usuarios/${form.id}`, { method: 'PATCH', body });
      avisar('Usuario actualizado.');
    } else {
      await api('/usuarios', {
        method: 'POST',
        body: { email: form.email, nombre: form.nombre, rol: form.rol, password: form.password },
      });
      avisar('Usuario creado. Compártele su correo y contraseña.');
    }
    form.abierto = false;
    await cargar();
  } catch (e) {
    form.error = e instanceof Error ? e.message : 'No se pudo guardar.';
  } finally {
    form.ocupado = false;
  }
}
</script>

<template>
  <main>
    <div class="spread">
      <div>
        <h1>Usuarios</h1>
        <p class="muted" style="margin: 4px 0 0">Quién puede entrar a la herramienta y qué puede hacer.</p>
      </div>
      <button class="btn primary" type="button" @click="abrir()">+ Nuevo usuario</button>
    </div>

    <div v-if="cargando" class="loading">Cargando usuarios…</div>
    <section v-else class="panel" style="padding: 0">
      <div class="tablewrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creado</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td>{{ u.nombre }}<span v-if="u.id === sesion.usuario?.id" class="muted"> (tú)</span></td>
              <td>{{ u.email }}</td>
              <td>{{ NOMBRE_ROL[u.rol] }}</td>
              <td><span class="chip" :class="u.activo ? 'st-ok' : 'st-na'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="num">{{ fecha(u.creadoEn) }}</td>
              <td><button class="btn small" type="button" @click="abrir(u)">Editar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ModalDialog
      v-if="form.abierto"
      :titulo="form.id ? 'Editar usuario' : 'Nuevo usuario'"
      :boton="form.id ? 'Guardar' : 'Crear usuario'"
      :error="form.error"
      :ocupado="form.ocupado"
      @enviar="guardar"
      @cerrar="form.abierto = false"
    >
      <div class="fgrid">
        <div class="field wide">
          <label for="u-nombre">Nombre</label>
          <input id="u-nombre" v-model="form.nombre" type="text" required />
        </div>
        <div class="field wide">
          <label for="u-email">Correo</label>
          <input id="u-email" v-model="form.email" type="email" :disabled="!!form.id" required />
        </div>
        <div class="field wide">
          <label for="u-rol">Rol</label>
          <select id="u-rol" v-model="form.rol">
            <option v-for="r in ROLES" :key="r.k" :value="r.k">{{ NOMBRE_ROL[r.k] }}: {{ r.desc }}</option>
          </select>
        </div>
        <div class="field wide">
          <label for="u-pass">{{ form.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial' }}</label>
          <input id="u-pass" v-model="form.password" type="password" autocomplete="new-password" minlength="8" />
        </div>
        <label v-if="form.id" class="row field wide" style="flex-direction: row">
          <input v-model="form.activo" type="checkbox" style="width: auto" /> Activo (puede iniciar sesión)
        </label>
      </div>
    </ModalDialog>
  </main>
</template>

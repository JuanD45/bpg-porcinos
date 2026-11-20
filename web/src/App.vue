<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from './api';
import { cerrarSesion, puede, sesion } from './auth';
import ModalDialog from './components/ModalDialog.vue';
import { NOMBRE_ROL } from './types';
import { avisar, responderConfirmacion, ui } from './ui';

const route = useRoute();
const router = useRouter();
const conBarra = computed(() => route.name !== 'login');

const clave = reactive({ abierto: false, actual: '', nueva: '', error: '', ocupado: false });

function abrirClave() {
  Object.assign(clave, { abierto: true, actual: '', nueva: '', error: '', ocupado: false });
}

async function cambiarClave() {
  if (clave.nueva.length < 8) {
    clave.error = 'La nueva contraseña debe tener al menos 8 caracteres.';
    return;
  }
  clave.ocupado = true;
  try {
    await api('/auth/cambiar-password', { method: 'POST', body: { actual: clave.actual, nueva: clave.nueva } });
    clave.abierto = false;
    avisar('Contraseña actualizada.');
  } catch (e) {
    clave.error = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.';
  } finally {
    clave.ocupado = false;
  }
}

function salir() {
  cerrarSesion();
  router.push({ name: 'login' });
}
</script>

<template>
  <header v-if="conBarra" class="top">
    <div class="top-in">
      <div class="brand">
        <b>Certificación BPG Porcina</b>
        <span>Res. ICA 76509/2020 · lista de chequeo y autoevaluación</span>
      </div>
      <nav class="nav" aria-label="Secciones">
        <RouterLink :to="{ name: 'granjas' }" :aria-current="route.name === 'granjas' || route.name === 'granja' ? 'page' : undefined">
          Granjas
        </RouterLink>
        <RouterLink :to="{ name: 'requisitos' }" :aria-current="route.name === 'requisitos' ? 'page' : undefined">
          Requisitos
        </RouterLink>
        <RouterLink
          v-if="puede.administrarUsuarios()"
          :to="{ name: 'usuarios' }"
          :aria-current="route.name === 'usuarios' ? 'page' : undefined"
        >
          Usuarios
        </RouterLink>
      </nav>
      <div v-if="sesion.usuario" class="userbox">
        <span><b>{{ sesion.usuario.nombre }}</b> · {{ NOMBRE_ROL[sesion.usuario.rol] }}</span>
        <button class="btn small" type="button" @click="abrirClave">Contraseña</button>
        <button class="btn small" type="button" @click="salir">Cerrar sesión</button>
      </div>
    </div>
  </header>

  <RouterView />

  <div v-if="ui.confirmacion" class="scrim" @mousedown.self="responderConfirmacion(false)">
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="conf-titulo">
      <h2 id="conf-titulo">{{ ui.confirmacion.titulo }}</h2>
      <p style="margin: 0">{{ ui.confirmacion.texto }}</p>
      <div class="row" style="justify-content: flex-end">
        <button class="btn" type="button" @click="responderConfirmacion(false)">Cancelar</button>
        <button class="btn danger" type="button" autofocus @click="responderConfirmacion(true)">
          {{ ui.confirmacion.boton }}
        </button>
      </div>
    </div>
  </div>

  <ModalDialog
    v-if="clave.abierto"
    titulo="Cambiar contraseña"
    boton="Cambiar"
    :error="clave.error"
    :ocupado="clave.ocupado"
    @enviar="cambiarClave"
    @cerrar="clave.abierto = false"
  >
    <div class="field">
      <label for="clave-actual">Contraseña actual</label>
      <input id="clave-actual" v-model="clave.actual" type="password" autocomplete="current-password" />
    </div>
    <div class="field">
      <label for="clave-nueva">Nueva contraseña (mínimo 8 caracteres)</label>
      <input id="clave-nueva" v-model="clave.nueva" type="password" autocomplete="new-password" />
    </div>
  </ModalDialog>

  <div v-for="a in ui.avisos" :key="a.id" class="toast" role="status">{{ a.texto }}</div>
</template>

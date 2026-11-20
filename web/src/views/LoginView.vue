<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { iniciarSesion } from '../auth';
import type { Usuario } from '../types';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref(route.query.vencida ? 'Tu sesión venció. Vuelve a iniciar sesión.' : '');
const ocupado = ref(false);

async function entrar() {
  error.value = '';
  if (!email.value.trim() || !password.value) {
    error.value = 'Escribe tu correo y tu contraseña.';
    return;
  }
  ocupado.value = true;
  try {
    const r = await api<{ token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value },
    });
    iniciarSesion(r.token, r.usuario);
    const destino = typeof route.query.ir === 'string' && route.query.ir.startsWith('/') ? route.query.ir : '/';
    router.replace(destino);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
  } finally {
    ocupado.value = false;
  }
}
</script>

<template>
  <main class="login">
    <form class="panel" novalidate @submit.prevent="entrar">
      <div>
        <div class="eyebrow">Res. ICA 76509/2020</div>
        <h1>Certificación BPG Porcina</h1>
        <p class="muted" style="margin: 4px 0 0">Lista de chequeo y autoevaluación de granjas porcícolas.</p>
      </div>
      <div class="field">
        <label for="login-email">Correo</label>
        <input id="login-email" v-model="email" type="email" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="login-pass">Contraseña</label>
        <input id="login-pass" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <p v-if="error" class="ferr" role="alert">{{ error }}</p>
      <button class="btn primary" type="submit" :disabled="ocupado" style="justify-content: center">
        {{ ocupado ? 'Entrando…' : 'Iniciar sesión' }}
      </button>
    </form>
  </main>
</template>

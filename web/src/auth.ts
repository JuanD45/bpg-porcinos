import { reactive } from 'vue';
import type { Usuario } from './types';

const CLAVE_TOKEN = 'bpg_token';
const CLAVE_USUARIO = 'bpg_usuario';

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

/** Sesión actual. Se guarda en localStorage para no pedir login en cada recarga. */
export const sesion = reactive({
  token: leer<string>(CLAVE_TOKEN, ''),
  usuario: leer<Usuario | null>(CLAVE_USUARIO, null),
});

export function iniciarSesion(token: string, usuario: Usuario) {
  sesion.token = token;
  sesion.usuario = usuario;
  localStorage.setItem(CLAVE_TOKEN, JSON.stringify(token));
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function cerrarSesion() {
  sesion.token = '';
  sesion.usuario = null;
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

/** Permisos de interfaz. La API vuelve a validar cada acción. */
export const puede = {
  editarCatalogo: () => sesion.usuario?.rol === 'admin',
  administrarUsuarios: () => sesion.usuario?.rol === 'admin',
  evaluar: () => sesion.usuario?.rol === 'admin' || sesion.usuario?.rol === 'auditor',
  eliminarGranja: () => sesion.usuario?.rol === 'admin',
  eliminarEvidencia: (subidoPorId: string | null) =>
    sesion.usuario?.rol === 'admin' || (sesion.usuario?.rol === 'auditor' && subidoPorId === sesion.usuario?.id),
};

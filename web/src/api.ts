import { cerrarSesion, sesion } from './auth';
import router from './router';

const BASE_API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Opciones {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
}

/** Llama a la API con el token de la sesión y devuelve el JSON de respuesta. */
export async function api<T = any>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (sesion.token) headers.Authorization = `Bearer ${sesion.token}`;
  let body: BodyInit | undefined;
  if (opciones.form) body = opciones.form;
  else if (opciones.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opciones.body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_API}/api${ruta}`, { method: opciones.method || 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.');
  }

  if (res.status === 401 && sesion.token) {
    cerrarSesion();
    router.push({ name: 'login', query: { vencida: '1' } });
  }
  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const j = await res.json();
      mensaje = Array.isArray(j.message) ? j.message.join(' ') : j.message || mensaje;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, mensaje);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Convierte una URL de archivo devuelta por la API en una URL que el navegador puede abrir. */
export function urlArchivo(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${BASE_API}${url}`;
}

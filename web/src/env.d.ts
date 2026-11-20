/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, any>;
  export default component;
}

interface ImportMetaEnv {
  /** URL de la API cuando está en otro dominio (p. ej. https://api.midominio.com). Vacío = mismo dominio. */
  readonly VITE_API_URL?: string;
}

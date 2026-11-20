import { reactive } from 'vue';

/** Avisos breves y diálogos de confirmación compartidos por toda la app. */
export const ui = reactive({
  avisos: [] as { id: number; texto: string }[],
  confirmacion: null as null | {
    titulo: string;
    texto: string;
    boton: string;
    resolver: (ok: boolean) => void;
  },
});

let siguiente = 1;

export function avisar(texto: string) {
  const id = siguiente++;
  ui.avisos.push({ id, texto });
  setTimeout(() => {
    const i = ui.avisos.findIndex((a) => a.id === id);
    if (i >= 0) ui.avisos.splice(i, 1);
  }, 3500);
}

export function confirmar(titulo: string, texto: string, boton = 'Eliminar'): Promise<boolean> {
  return new Promise((resolver) => {
    ui.confirmacion = { titulo, texto, boton, resolver };
  });
}

export function responderConfirmacion(ok: boolean) {
  ui.confirmacion?.resolver(ok);
  ui.confirmacion = null;
}

/** Muestra el mensaje de un error de la API. */
export function avisarError(e: unknown) {
  avisar(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
}

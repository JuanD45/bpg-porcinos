/**
 * Cálculo del cumplimiento y del dictamen preliminar, igual al de la lista de
 * chequeo en Excel:
 *   % = ítems que cumplen ÷ (total − no aplica); si el denominador es 0, 100 %.
 *   La granja es certificable cuando cada nivel (F, My, Mn) alcanza su meta.
 * Este archivo es idéntico a web/src/lib/cumplimiento.ts.
 */
export type NivelK = 'F' | 'My' | 'Mn';
export type EstadoK = 'CUMPLE' | 'NO CUMPLE' | 'NO APLICA' | null | undefined;
export type Umbrales = Record<NivelK, number>;

export interface Conteo {
  total: number;
  cumple: number;
  noCumple: number;
  noAplica: number;
  pendientes: number;
  pct: number;
}
export interface ResumenNivel extends Conteo {
  nivel: NivelK;
  meta: number;
  cumpleMeta: boolean;
}
export interface ResumenCapitulo extends Conteo {
  capitulo: string;
}
export interface Resumen {
  niveles: ResumenNivel[];
  capitulos: ResumenCapitulo[];
  total: Conteo;
  certificable: boolean;
  pendientes: number;
}

export interface RequisitoMin {
  id: string;
  codigo: string;
  capitulo: string;
  nivel: NivelK;
}

export const UMBRALES_POR_DEFECTO: Umbrales = { F: 1, My: 0.8, Mn: 0.6 };
const NIVELES: NivelK[] = ['F', 'My', 'Mn'];

/** Ordena códigos tipo "1.10" después de "1.9". */
export function claveCodigo(codigo: string): string {
  return String(codigo || '')
    .split('.')
    .map((n) => String(parseInt(n, 10) || 0).padStart(4, '0'))
    .join('.');
}

function vacio(): Conteo {
  return { total: 0, cumple: 0, noCumple: 0, noAplica: 0, pendientes: 0, pct: 1 };
}
function sumar(c: Conteo, estado: EstadoK) {
  c.total++;
  if (estado === 'CUMPLE') c.cumple++;
  else if (estado === 'NO CUMPLE') c.noCumple++;
  else if (estado === 'NO APLICA') c.noAplica++;
  else c.pendientes++;
}
function cerrar(c: Conteo) {
  const base = c.total - c.noAplica;
  c.pct = base > 0 ? c.cumple / base : 1;
}

export function calcularResumen(
  requisitos: RequisitoMin[],
  estadoDe: (requisitoId: string) => EstadoK,
  umbrales: Umbrales = UMBRALES_POR_DEFECTO,
): Resumen {
  const lista = [...requisitos].sort((a, b) => (claveCodigo(a.codigo) < claveCodigo(b.codigo) ? -1 : 1));
  const porNivel = new Map<NivelK, Conteo>(NIVELES.map((n) => [n, vacio()]));
  const porCapitulo = new Map<string, Conteo>();
  const total = vacio();

  for (const r of lista) {
    const estado = estadoDe(r.id);
    if (!porNivel.has(r.nivel)) porNivel.set(r.nivel, vacio());
    if (!porCapitulo.has(r.capitulo)) porCapitulo.set(r.capitulo, vacio());
    sumar(porNivel.get(r.nivel), estado);
    sumar(porCapitulo.get(r.capitulo), estado);
    sumar(total, estado);
  }

  const niveles: ResumenNivel[] = NIVELES.map((nivel) => {
    const c = porNivel.get(nivel);
    cerrar(c);
    const meta = Number(umbrales[nivel] ?? UMBRALES_POR_DEFECTO[nivel]);
    return { ...c, nivel, meta, cumpleMeta: c.pct >= meta - 1e-9 };
  });
  const capitulos: ResumenCapitulo[] = [...porCapitulo.entries()].map(([capitulo, c]) => {
    cerrar(c);
    return { ...c, capitulo };
  });
  cerrar(total);

  return {
    niveles,
    capitulos,
    total,
    certificable: niveles.every((n) => n.cumpleMeta),
    pendientes: total.pendientes,
  };
}

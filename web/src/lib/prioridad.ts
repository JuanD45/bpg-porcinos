import type { Estado, Nivel } from '../types';
import type { Resumen } from './cumplimiento';

export interface Prioridad {
  texto: string;
  clase: string;
  orden: number;
}

/** Prioridad de una no conformidad según el nivel del requisito. */
export function prioridad(nivel: Nivel, estado: Estado | null | undefined): Prioridad | null {
  if (estado !== 'NO CUMPLE') return null;
  if (nivel === 'F') return { texto: 'Crítica (bloqueante)', clase: 'st-bad', orden: 0 };
  if (nivel === 'My') return { texto: 'Alta', clase: 'st-warn', orden: 1 };
  return { texto: 'Media', clase: 'st-na', orden: 2 };
}

export interface Dictamen {
  clase: '' | 'ok' | 'bad' | 'warn';
  titulo: string;
  detalle: string;
}

const NOMBRES: Record<string, string> = { F: 'fundamentales', My: 'mayores', Mn: 'menores' };

/** Texto del dictamen preliminar a partir del resumen. */
export function dictamen(r: Resumen): Dictamen {
  if (r.total.total === 0)
    return { clase: '', titulo: 'Sin requisitos', detalle: 'Agrega requisitos en la sección Requisitos para poder evaluar.' };
  if (r.pendientes === r.total.total)
    return { clase: '', titulo: 'Evaluación sin iniciar', detalle: `Faltan ${r.pendientes} ítems por calificar.` };
  if (r.certificable && r.pendientes === 0)
    return {
      clase: 'ok',
      titulo: 'Concepto certificable',
      detalle: 'La granja cumple las metas mínimas por nivel y está apta para radicar la solicitud de auditoría BPG ante el ICA.',
    };
  if (r.certificable)
    return {
      clase: 'warn',
      titulo: 'Certificable de forma preliminar',
      detalle: `Con lo calificado se cumplen las metas, pero faltan ${r.pendientes} ítems por evaluar.`,
    };
  const fallan = r.niveles.filter((n) => !n.cumpleMeta).map((n) => NOMBRES[n.nivel]).join(', ');
  return {
    clase: 'bad',
    titulo: 'Concepto no certificable',
    detalle:
      `No se alcanza la meta en criterios ${fallan}. Subsana las brechas del plan de acción antes de radicar.` +
      (r.pendientes ? ` Faltan ${r.pendientes} ítems por evaluar.` : ''),
  };
}

export function clasePill(d: Dictamen): string {
  return d.clase === 'ok' ? 'st-ok' : d.clase === 'bad' ? 'st-bad' : d.clase === 'warn' ? 'st-warn' : 'st-na';
}

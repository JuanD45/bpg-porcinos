import type { Resumen } from './lib/cumplimiento';

export type Rol = 'admin' | 'auditor' | 'lector';
export type Nivel = 'F' | 'My' | 'Mn';
export type Estado = 'CUMPLE' | 'NO CUMPLE' | 'NO APLICA';
export type Avance = 'Pendiente' | 'En ejecución' | 'Cerrado';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo?: boolean;
  creadoEn?: string;
}

export interface Requisito {
  id: string;
  codigo: string;
  capitulo: string;
  referencia: string;
  nivel: Nivel;
  requisito: string;
  evidencia: string;
  activo: boolean;
}

export interface Granja {
  id: string;
  nombre: string;
  municipio: string;
  registroSanitario: string;
  asi: string;
  mvz: string;
  tipo: string;
  creadoEn: string;
  totalEvaluaciones?: number;
  ultimaEvaluacion?: { id: string; fecha: string; resumen: Resumen } | null;
}

export interface Evaluacion {
  id: string;
  granjaId: string;
  fecha: string;
  evaluador: string;
  creadoEn: string;
  resumen?: Resumen;
}

export interface Evidencia {
  id: string;
  respuestaId: string;
  nombreArchivo: string;
  contentType: string;
  tamano: number;
  subidoPorId: string | null;
  creadoEn: string;
  url: string;
}

export interface Respuesta {
  id?: string;
  evaluacionId: string;
  requisitoId: string;
  estado: Estado | null;
  observaciones: string;
  accion: string;
  evidenciaCierre: string;
  responsable: string;
  fechaCompromiso: string | null;
  inversion: number | null;
  avance: Avance | null;
  evidencias: Evidencia[];
}

export type Umbrales = Record<Nivel, number>;

export const NIVELES: { k: Nivel; nombre: string; corto: string; desc: string }[] = [
  { k: 'F', nombre: 'Fundamentales', corto: 'Fundamental', desc: 'Bloqueantes' },
  { k: 'My', nombre: 'Mayores', corto: 'Mayor', desc: 'Alto impacto' },
  { k: 'Mn', nombre: 'Menores', corto: 'Menor', desc: 'Mejora continua' },
];
export const NOMBRE_NIVEL: Record<Nivel, string> = { F: 'Fundamental', My: 'Mayor', Mn: 'Menor' };
export const NOMBRE_ROL: Record<Rol, string> = { admin: 'Administrador', auditor: 'Auditor', lector: 'Lector' };

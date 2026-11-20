import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type Rol = 'admin' | 'auditor' | 'lector';
export type Nivel = 'F' | 'My' | 'Mn';
export type Estado = 'CUMPLE' | 'NO CUMPLE' | 'NO APLICA';
export type Avance = 'Pendiente' | 'En ejecución' | 'Cerrado';

export const ROLES: Rol[] = ['admin', 'auditor', 'lector'];
export const NIVELES: Nivel[] = ['F', 'My', 'Mn'];
export const ESTADOS: Estado[] = ['CUMPLE', 'NO CUMPLE', 'NO APLICA'];
export const AVANCES: Avance[] = ['Pendiente', 'En ejecución', 'Cerrado'];

/** numeric de Postgres llega como string: lo convertimos a number. */
const numerico = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null || v === undefined ? null : Number(v)),
};

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() email: string;
  @Column() nombre: string;
  @Column({ name: 'password_hash', select: false }) passwordHash: string;
  @Column({ type: 'text' }) rol: Rol;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn: Date;
}

@Entity('requisitos')
export class Requisito {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() codigo: string;
  @Column() capitulo: string;
  @Column({ default: '' }) referencia: string;
  @Column({ type: 'text' }) nivel: Nivel;
  @Column({ type: 'text' }) requisito: string;
  @Column({ type: 'text', default: '' }) evidencia: string;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn: Date;
  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' }) actualizadoEn: Date;
}

@Entity('granjas')
export class Granja {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() nombre: string;
  @Column({ default: '' }) municipio: string;
  @Column({ name: 'registro_sanitario', default: '' }) registroSanitario: string;
  @Column({ default: '' }) asi: string;
  @Column({ default: '' }) mvz: string;
  @Column({ default: '' }) tipo: string;
  @Column({ name: 'creado_por', type: 'uuid', nullable: true }) creadoPorId: string | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn: Date;
}

@Entity('evaluaciones')
export class Evaluacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'granja_id', type: 'uuid' }) granjaId: string;
  @Column({ type: 'date' }) fecha: string;
  @Column({ default: '' }) evaluador: string;
  @Column({ name: 'creado_por', type: 'uuid', nullable: true }) creadoPorId: string | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn: Date;
}

@Entity('respuestas')
export class Respuesta {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'evaluacion_id', type: 'uuid' }) evaluacionId: string;
  @Column({ name: 'requisito_id', type: 'uuid' }) requisitoId: string;
  @Column({ type: 'text', nullable: true }) estado: Estado | null;
  @Column({ type: 'text', default: '' }) observaciones: string;
  @Column({ type: 'text', default: '' }) accion: string;
  @Column({ name: 'evidencia_cierre', type: 'text', default: '' }) evidenciaCierre: string;
  @Column({ default: '' }) responsable: string;
  @Column({ name: 'fecha_compromiso', type: 'date', nullable: true }) fechaCompromiso: string | null;
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: numerico })
  inversion: number | null;
  @Column({ type: 'text', nullable: true }) avance: Avance | null;
  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true }) actualizadoPorId: string | null;
  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' }) actualizadoEn: Date;
}

@Entity('evidencias')
export class Evidencia {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'respuesta_id', type: 'uuid' }) respuestaId: string;
  @Column({ name: 'clave_archivo' }) claveArchivo: string;
  @Column({ name: 'nombre_archivo' }) nombreArchivo: string;
  @Column({ name: 'content_type' }) contentType: string;
  @Column({ type: 'integer' }) tamano: number;
  @Column({ name: 'subido_por', type: 'uuid', nullable: true }) subidoPorId: string | null;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn: Date;
}

@Entity('configuracion')
export class Configuracion {
  @PrimaryColumn() clave: string;
  @Column({ type: 'jsonb' }) valor: any;
}

export const ENTIDADES = [Usuario, Requisito, Granja, Evaluacion, Respuesta, Evidencia, Configuracion];

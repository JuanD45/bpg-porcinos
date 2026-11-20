import { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea las tablas de la herramienta de certificación BPG. */
export class EsquemaInicial1763600000000 implements MigrationInterface {
  name = 'EsquemaInicial1763600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  password_hash text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('admin','auditor','lector')),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requisitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  capitulo text NOT NULL,
  referencia text NOT NULL DEFAULT '',
  nivel text NOT NULL CHECK (nivel IN ('F','My','Mn')),
  requisito text NOT NULL,
  evidencia text NOT NULL DEFAULT '',
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE granjas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  municipio text NOT NULL DEFAULT '',
  registro_sanitario text NOT NULL DEFAULT '',
  asi text NOT NULL DEFAULT '',
  mvz text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT '',
  creado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  granja_id uuid NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  evaluador text NOT NULL DEFAULT '',
  creado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evaluaciones_granja_idx ON evaluaciones (granja_id, fecha DESC);

CREATE TABLE respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id uuid NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  requisito_id uuid NOT NULL REFERENCES requisitos(id) ON DELETE CASCADE,
  estado text CHECK (estado IN ('CUMPLE','NO CUMPLE','NO APLICA')),
  observaciones text NOT NULL DEFAULT '',
  accion text NOT NULL DEFAULT '',
  evidencia_cierre text NOT NULL DEFAULT '',
  responsable text NOT NULL DEFAULT '',
  fecha_compromiso date,
  inversion numeric(14,2) CHECK (inversion IS NULL OR inversion >= 0),
  avance text CHECK (avance IN ('Pendiente','En ejecución','Cerrado')),
  actualizado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluacion_id, requisito_id)
);

CREATE TABLE evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respuesta_id uuid NOT NULL REFERENCES respuestas(id) ON DELETE CASCADE,
  clave_archivo text NOT NULL UNIQUE,
  nombre_archivo text NOT NULL,
  content_type text NOT NULL,
  tamano integer NOT NULL,
  subido_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidencias_respuesta_idx ON evidencias (respuesta_id);

CREATE TABLE configuracion (
  clave text PRIMARY KEY,
  valor jsonb NOT NULL
);
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS evidencias, respuestas, evaluaciones, granjas, requisitos, configuracion, usuarios CASCADE;`);
  }
}

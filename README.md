# Certificación BPG Porcina

Herramienta web para verificar si una granja porcícola cumple los requisitos de la certificación en **Buenas Prácticas Ganaderas (BPG)** del ICA (Resolución ICA 76509 de 2020 y normas relacionadas).

Permite mantener el catálogo de requisitos, registrar granjas, aplicar la lista de chequeo en cada visita, adjuntar fotos y documentos como evidencia, y obtener el dictamen preliminar con su plan de acción correctiva.

## Funcionalidades

- **Catálogo de requisitos editable**: ítem, capítulo normativo, referencia legal, nivel de criticidad (F fundamental, My mayor, Mn menor), requisito técnico y evidencia exigida. Viene cargado con los 45 requisitos de la lista de chequeo ICA.
- **Metas mínimas por nivel** configurables (por defecto F 100 %, My 80 %, Mn 60 %).
- **Granjas y evaluaciones**: cada granja guarda el historial de sus evaluaciones.
- **Lista de chequeo**: cada ítem se califica como Cumple, No cumple o No aplica, con observaciones y filtros por capítulo, nivel y estado.
- **Dictamen automático**: % de cumplimiento por nivel y por capítulo, y concepto certificable / no certificable.
- **Plan de acción**: las no conformidades se ordenan por prioridad (crítica, alta, media), con acción correctiva, responsable, fecha compromiso, inversión y avance.
- **Evidencias**: fotos (JPG, PNG, WEBP) y PDF por ítem. Las fotos se reducen en el navegador antes de subirse.
- **Usuarios y roles**: administrador, auditor y lector.
- **Exportación a CSV** compatible con Excel.

## Arquitectura

```
┌──────────────┐   HTTPS / JSON   ┌───────────────┐        ┌──────────────┐
│  Vue 3 + Vite│ ───────────────▶ │  NestJS (API) │ ─────▶ │  PostgreSQL  │
│  (web/)      │ ◀─────────────── │  (api/)       │        └──────────────┘
└──────────────┘    JWT Bearer    │               │        ┌──────────────┐
        ▲                         │               │ ─────▶ │ S3 / disco   │
        └──── URL firmada ────────┴───────────────┘        │ (evidencias) │
                                                           └──────────────┘
```

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 (Composition API, `<script setup>`), Vue Router, TypeScript, Vite |
| Backend | NestJS 10, TypeORM, class-validator, Passport JWT, bcrypt |
| Base de datos | PostgreSQL 16 (migraciones automáticas al iniciar) |
| Archivos | Amazon S3 (o compatible) con URL firmadas; disco local para desarrollo |
| Contenedores | Docker y Docker Compose; nginx sirve el frontend |

### Roles

| Acción | Administrador | Auditor | Lector |
|---|:-:|:-:|:-:|
| Ver granjas, evaluaciones y catálogo | ✓ | ✓ | ✓ |
| Crear y editar granjas | ✓ | ✓ | |
| Crear evaluaciones, calificar y subir evidencias | ✓ | ✓ | |
| Eliminar evidencias | Todas | Solo las suyas | |
| Eliminar granjas | ✓ | | |
| Editar catálogo de requisitos y metas | ✓ | | |
| Administrar usuarios | ✓ | | |

Los permisos se validan en la API (guards de NestJS). La interfaz solo oculta los botones que el rol no puede usar.

## Ejecutar en local con Docker (recomendado)

Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Abre **http://localhost:8080** e inicia sesión con:

- Correo: `admin@bpg.local`
- Contraseña: `Admin12345`

Al arrancar por primera vez, la API crea las tablas, carga los 45 requisitos, una granja de ejemplo con su autoevaluación y el usuario administrador. Las evidencias se guardan en un volumen de Docker.

Para crear usuarios de prueba (por ejemplo, para tu profesor), entra como administrador y abre **Usuarios → Nuevo usuario**.

## Desarrollo sin Docker

Requisitos: Node.js 20 o superior y PostgreSQL 14 o superior.

```bash
# 1. Base de datos (o usa: docker compose up db)
createdb bpg

# 2. API
cd api
cp .env.example .env        # revisa DATABASE_URL y JWT_SECRET
npm install
npm run start:dev           # http://localhost:3000/api

# 3. Frontend (en otra terminal)
cd web
npm install
npm run dev                 # http://localhost:5173  (redirige /api a la API)
```

Pruebas unitarias del cálculo de cumplimiento:

```bash
cd api && npm test
```

## Variables de entorno de la API

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgres://usuario:clave@host:5432/bpg` |
| `DATABASE_SSL` | `true` si el proveedor exige SSL | `true` |
| `JWT_SECRET` | Secreto para firmar sesiones. **Obligatorio y largo en producción** | cadena aleatoria de 64 caracteres |
| `JWT_EXPIRES_IN` | Duración de la sesión | `12h` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOMBRE` | Administrador inicial (solo si no hay usuarios) | |
| `CORS_ORIGIN` | Dominios del frontend, separados por coma | `https://bpg.vercel.app` |
| `STORAGE_DRIVER` | `local` o `s3` | `s3` |
| `STORAGE_LOCAL_DIR` | Carpeta de evidencias en modo local | `./uploads` |
| `PUBLIC_API_URL` | URL pública de la API (modo local con dominios separados) | `https://api.midominio.com` |
| `S3_BUCKET`, `S3_REGION` | Bucket y región de S3 | `bpg-evidencias`, `us-east-1` |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Credenciales IAM (opcional si usas un rol) | |
| `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Solo para servicios compatibles con S3 (MinIO, R2) | |

Frontend: `VITE_API_URL` con la URL de la API cuando está en otro dominio (sin `/api`). Vacío si comparten dominio.

## Despliegue en internet

Una forma sencilla de publicarlo:

1. **Base de datos**: crea un PostgreSQL gestionado (Neon, Render, Railway o Amazon RDS). Copia la cadena de conexión a `DATABASE_URL` y pon `DATABASE_SSL=true`.
2. **Evidencias en S3**:
   - Crea un bucket **privado** (bloqueo de acceso público activado).
   - Crea un usuario IAM con esta política mínima y genera sus claves de acceso:

     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::NOMBRE-DEL-BUCKET/*"
       }]
     }
     ```

   - No hace falta configurar CORS en el bucket: los archivos se suben a través de la API y se muestran con URL firmadas.
3. **API**: crea un servicio web desde el `Dockerfile` de `api/` (Render, Railway, AWS App Runner o similar). Define las variables de la tabla anterior con `STORAGE_DRIVER=s3`. Comprueba que `https://tu-api/api/health` responde `{"ok":true}`.
4. **Frontend**: importa el repositorio en Vercel o Netlify con:
   - Directorio raíz: `web`
   - Comando de build: `npm run build`
   - Carpeta de salida: `dist`
   - Variable: `VITE_API_URL=https://tu-api`

   Los archivos `vercel.json` y `public/_redirects` ya configuran las rutas de Vue Router.
5. Agrega el dominio del frontend a `CORS_ORIGIN` en la API.
6. Entra con el administrador inicial, **cambia su contraseña** (botón "Contraseña" en la barra) y crea los usuarios.

Revisa los límites y costos del plan que elijas en cada proveedor. Algunos planes gratuitos suspenden el servicio por inactividad.

## API REST

Todas las rutas empiezan por `/api` y, salvo `auth/login`, `health` y `archivos`, requieren `Authorization: Bearer <token>`.

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/login` | público | Inicia sesión, devuelve token y usuario |
| GET | `/auth/me` | todos | Usuario actual |
| POST | `/auth/cambiar-password` | todos | Cambia la contraseña propia |
| GET / POST / PATCH | `/usuarios`, `/usuarios/:id` | admin | Administración de usuarios |
| GET | `/requisitos?activos=true` | todos | Catálogo ordenado por ítem |
| POST / PATCH / DELETE | `/requisitos`, `/requisitos/:id` | admin | Editar catálogo |
| GET / PUT | `/configuracion/umbrales` | todos / admin | Metas por nivel |
| GET | `/granjas` | todos | Granjas con el resumen de su última evaluación |
| GET / POST / PATCH / DELETE | `/granjas`, `/granjas/:id` | auditor / admin | Granjas |
| GET / POST | `/granjas/:id/evaluaciones` | todos / auditor | Evaluaciones de una granja |
| GET / PATCH / DELETE | `/evaluaciones/:id` | todos / auditor | Evaluación con respuestas y evidencias |
| PUT | `/evaluaciones/:id/respuestas/:requisitoId` | auditor | Guarda estado, observaciones y plan de acción |
| POST | `/evaluaciones/:id/respuestas/:requisitoId/evidencias` | auditor | Sube archivos (`multipart/form-data`, campo `archivos`) |
| DELETE | `/evidencias/:id` | auditor | Elimina una evidencia |

## Modelo de datos

```
usuarios ─┐
          │ creado_por / actualizado_por / subido_por
granjas ──┼─< evaluaciones ─< respuestas >── requisitos
          │                       │
          │                       └─< evidencias (clave del archivo en S3 o disco)
configuracion (umbrales)
```

- `respuestas` tiene una fila por requisito evaluado (`UNIQUE (evaluacion_id, requisito_id)`). Los ítems sin fila cuentan como pendientes.
- Al eliminar una granja, una evaluación o un requisito, se eliminan en cascada sus respuestas y evidencias, y la API borra también los archivos.

## Cálculo del dictamen

- % de cumplimiento = ítems que cumplen ÷ (total − no aplica). Si todos son "no aplica", el nivel queda en 100 %.
- La granja es **certificable** cuando F, My y Mn alcanzan su meta. Basta un fundamental incumplido (con meta 100 %) para que no sea certificable.
- Prioridad de una no conformidad: F → crítica (bloqueante), My → alta, Mn → media.

La lógica está en `api/src/common/cumplimiento.ts` (con pruebas en `cumplimiento.spec.ts`), y una copia idéntica en `web/src/lib/cumplimiento.ts` recalcula el dictamen en vivo mientras se califica.

## Estructura del proyecto

```
bpg-porcinos/
├── docker-compose.yml
├── api/                         NestJS
│   ├── Dockerfile
│   └── src/
│       ├── main.ts, app.module.ts
│       ├── auth/                login, JWT, cambio de contraseña
│       ├── usuarios/            CRUD de usuarios (admin)
│       ├── requisitos/          catálogo
│       ├── configuracion/       metas por nivel
│       ├── granjas/             granjas + resumen de última evaluación
│       ├── evaluaciones/        evaluaciones y respuestas
│       ├── evidencias/          subida y borrado de archivos
│       ├── storage/             S3 o disco local con URL firmadas
│       ├── common/              guards, decoradores, cálculo de cumplimiento
│       └── database/            entidades y migraciones (esquema + 45 requisitos)
└── web/                         Vue 3
    ├── Dockerfile, nginx.conf, vercel.json
    └── src/
        ├── views/               Login, Granjas, Granja, Requisitos, Usuarios
        ├── components/          EvaluacionPanel, ChecklistItem, PlanItem, EvidenciasGaleria…
        ├── lib/                 cumplimiento, formato, imagen, csv, prioridad
        └── api.ts, auth.ts, router.ts, ui.ts
```

## Referencias normativas

Resolución ICA 76509 de 2020 (BPG), Resolución ICA 115708 de 2021 (ASI), Resolución MADR 136 de 2020 y Resolución ICA 16409 de 2024 (bienestar animal), Resolución ICA 18426 de 2025. La lista de chequeo y el dictamen son una **autoevaluación preliminar**; la certificación la otorga el ICA tras su auditoría.

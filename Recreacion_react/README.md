# Club360 — Réplica moderna (React + NestJS + MySQL)

Referencia de negocio y datos: carpeta `PHP_version` (CakePHP). La API **solo** persiste en **MySQL/MariaDB**: las entidades TypeORM mapean las tablas existentes (`synchronize: false`). Si cambias el esquema en Workbench u otro cliente, ajusta las entidades / consultas en código para seguir el modelo real (**hexagonal**: la aplicación se adapta al puerto de persistencia MySQL, no al revés).

El DDL opcional que el asistente puede aplicar está en `database/schema/schema_mysql.sql` (alineado con `PHP_version/db/club360_seed_v19.sql`). También puedes crear las tablas tú mismo y usar solo las entidades como mapa. La carpeta `database/` está organizada en subdirectorios (ver `database/README.md`). Para **desarrollo desde cero** con Prisma (migraciones + seed TypeScript), ver la sección **Prisma** más abajo.

## Arquitectura (frontend / API / base de datos)

| Capa | Tecnología | Rol |
|------|------------|-----|
| **Frontend** | React + Vite | Solo habla con el backend por **HTTP** (`/api/...`). |
| **Backend** | NestJS + **TypeORM** | Expone la API REST; persiste en MariaDB/MySQL. |
| **Base de datos** | MariaDB/MySQL | Datos persistentes. |
| **Prisma** | `backend/prisma/` | **Migraciones** (`migrate deploy`) y seed opcional; **no** es el cliente de las peticiones CRUD en runtime. |

Sí: **toda la interacción CRUD de la aplicación web con los datos pasa por la API REST**. El usuario no ejecuta SQL ni Prisma desde el navegador.

## Requisitos

- Node.js 20+
- MySQL 8+ / MariaDB 10.6+ (local o Docker). Índices funcionales típicos de MySQL 8.

### Base de datos en Docker (un servicio por carpeta)

- **`services/database/`** — MariaDB + job **`prisma migrate deploy`** al subir el stack (recomendado). Ver **`services/database/README.md`**.
- **`services/mysql/`** — solo MySQL 8 en Docker, sin migrate automático.
- Índice: **`services/README.md`**.

La carpeta **`database/`** (en la raíz) **no** es un contenedor: ahí están los SQL de esquema y seed versionados.

## Salud de la base de datos (tras instalación)

Con TypeORM ya cargado:

- `GET /api/health/database` → `{ ok: true, driver: "mysql", database: "club360" }` si la conexión responde.

## Modo claro / oscuro

La interfaz usa una paleta **grises, negro y rojo** (`src/index.css`, variables `data-theme="light" | "dark"`). El interruptor está en login, home y asistente de instalación; la preferencia se guarda en `localStorage`.

## Asistente de instalación (wizard)

Si **no** existen los marcadores en `backend/data/` (`installed.txt` o `.installed`), la API arranca **solo** el módulo de instalación (sin TypeORM). El frontend muestra un wizard que:

1. Comprueba la conexión a MySQL.
2. Opcionalmente ejecuta `database/schema/schema_mysql.sql`.
3. Ejecuta `database/seed/seed_mvp_mysql.sql` (datos mínimos MVP).
4. Actualiza `gym_member` id `1` con el administrador (bcrypt).
5. Ajusta `AUTO_INCREMENT` y genera `backend/.env`.
6. Crea los marcadores en `backend/data/`.

Después de instalar, **reinicia el backend** para cargar TypeORM.

### Endpoints instalación

- `GET /api/install/status` → `{ installed: boolean }`
- `POST /api/install/test-db`
- `POST /api/install/run`

## MySQL local

### Docker (recomendado: stack MariaDB + migraciones)

```bash
cd services/database
docker compose up -d --build
```

Por defecto: `root` / `root`, base `club360`, puerto `3306`. Alternativa mínima: `services/mysql/` (MySQL 8 sin job Prisma al arrancar).

### Workbench / MariaDB / XAMPP

Crea la base y usuarios según tu entorno. Si Node falla con `auth_gssapi`, ejecuta `database/ops/mariadb-node-auth.sql`.

## Arranque sin Docker (solo API + web)

```powershell
cd Recreacion_react
npm run local
```

Muestra en consola los comandos manuales recomendados. Para limpiar marcadores de instalación y `backend/.env`: `.\club360.ps1 -ResetInstall`.

## Arranque en Windows (sin scripts de arranque)

En dos terminales, desde `Recreacion_react`:

```powershell
cd backend; npm run start:dev
```

```powershell
cd frontend; npm run dev
```

## Instalación manual de BD (sin wizard)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS club360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p club360 < database/schema/schema_mysql.sql
mysql -u root -p club360 < database/seed/seed_mvp_mysql.sql
```

Copia `backend/.env.example` a `backend/.env` y crea `backend/data/installed.txt` para marcar instalación hecha.

## Prisma (migraciones y población inicial)

El esquema MySQL está modelado también en `backend/prisma/schema.prisma` (alineado con `src/entities/*.entity.ts` y `database/schema/schema_mysql.sql`). TypeORM sigue siendo el cliente en runtime; Prisma sirve para **versionar DDL** y ejecutar el **seed MVP** en TypeScript.

1. En `backend/.env`, define `DATABASE_URL` (misma base que `DATABASE_*`; ver `.env.example`).
2. Desde `backend/`:

```bash
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

- `db:generate` — genera el cliente Prisma.
- `migrate deploy` — aplica las migraciones en `prisma/migrations/` (incluye la inicial).
- `db:seed` — borra datos MVP conocidos y reinserta configuración, roles, planes y usuarios demo (mismos hashes que `database/seed/seed_mvp_mysql.sql`).

Para iterar el modelo en local sin historial: `npm run db:push`. El asistente web de instalación **no** invoca Prisma todavía; sigue usando los SQL en `database/`.

## API (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

- Prefijo global: `/api`
- Persistencia: **solo MySQL** vía TypeORM (`src/infrastructure/persistence/mysql-typeorm.factory.ts`).
- Login: `POST /api/auth/login`

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` — proxy `/api` → puerto `3000`.

## Estructura

- `database/schema/` — DDL completo para instalaciones nuevas (wizard).
- `database/seed/` — datos mínimos MVP (`seed_mvp_mysql.sql`).
- `database/ops/` — utilidades de entorno (p. ej. compatibilidad auth MariaDB + Node, `truncate_mvp_all_tables.sql` para vaciado manual).
- `services/mysql/` — Docker Compose con MySQL 8 solo para desarrollo (opcional).
- `backend/src/infrastructure/persistence/` — adaptador TypeORM ↔ MySQL.
- `backend/prisma/` — modelo Prisma, migraciones y seed MVP (alternativa al SQL manual).
- `frontend/` — React (TypeScript).

# Base de datos (Club360 — réplica React/Nest)

Aquí viven los **archivos SQL** (esquema, seed, ops). Los **contenedores** Docker están en **`../services/`** (`services/database`, `services/mysql`).

## Carpetas

- **`schema/`** — DDL completo para instalaciones nuevas (`schema_mysql.sql`). Lo aplica el asistente Nest cuando eliges crear tablas.
- **`seed/`** — Datos mínimos MVP (`seed_mvp_mysql.sql`) tras el DDL.
- **`ops/`** — Utilidades de entorno (p. ej. `mariadb-node-auth.sql` para compatibilidad MariaDB + Node en Windows).

El backend localiza estos archivos con `resolveRepoDatabaseFile(...)` en `backend/src/install/database-path.ts`.

**Historial de cambios de esquema:** usa `backend/prisma/` (`migrate dev` / `migrate deploy`) y mantén `schema/schema_mysql.sql` alineado con las entidades TypeORM para el wizard y quien instale solo con SQL.

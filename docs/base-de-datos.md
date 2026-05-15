# Base de datos — esquema y seed

Artefactos SQL versionados en `backend/database/`. **Una responsabilidad por fichero** — no duplicar INSERTs ni DDL en otros sitios.

| Artefacto | Ruta | Contenido |
|-----------|------|-----------|
| **Esquema** | `backend/database/schema/schema_mysql.sql` | TRUNCATE opcional + DDL (`CREATE TABLE IF NOT EXISTS`, 24 tablas MVP) |
| **Datos demo** | `backend/database/seed/seed_mvp.sql` | Todos los `INSERT` de prueba |

Rutas en código: `backend/src/infrastructure/database/database-artifacts.ts`.  
Wizard: `backend/src/install/sql-install.helper.ts`.

Reglas de desarrollo (SQL directo en dev, migraciones solo prod): **[desarrollo.md §3](./desarrollo.md#3-reglas-de-base-de-datos-obligatorias-en-dev--demo)**.

---

## Flujos de aplicación

| Flujo | Qué ejecuta |
|-------|-------------|
| **Wizard** (BD vacía tras DROP) | Solo bloque «Esquema» de `schema_mysql.sql` + `seed_mvp.sql` → admin del asistente |
| **`npm run db:seed`** | Schema completo (TRUNCATE + DDL) + `seed_mvp.sql` |
| **Manual** | `mysql … < schema_mysql.sql` luego `mysql … < seed_mvp.sql` |

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS club360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd backend && npm run db:seed
```

Tras `db:seed` o wizard: **reiniciar el backend** si ya estaba en marcha.

---

## Prisma en este repo

- `backend/prisma/schema.prisma` — modelo alineado con TypeORM y `schema_mysql.sql`.
- `npm run db:generate` — genera cliente Prisma.
- **No** hay `prisma/migrations` en dev/demo.
- Migraciones Prisma: **solo producción futura** cuando no se pueda resetear con el wizard (ver [desarrollo.md](./desarrollo.md)).

---

## Usuarios demo (`seed_mvp.sql`)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | La del **wizard** (o `admin` si solo usaste `db:seed`) | Administrador |
| `staff` | `staff` | Staff |
| `ana_member` / `luis_member` | `member123` | Socio |

En producción: cambiar todas las contraseñas.

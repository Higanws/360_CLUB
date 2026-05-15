# Docker — MariaDB y MySQL

Contenedores en `services/`. Los artefactos SQL versionados están en `backend/database/` (no son un servicio).

Aplicar esquema y seed en host (recomendado, alineado con el wizard):

```powershell
cd backend
npm run db:seed
```

O manualmente contra el puerto expuesto por Docker — ver [base-de-datos.md](./base-de-datos.md).

---

## `services/database/` — MariaDB 11 (recomendado)

| Componente | Rol |
|------------|-----|
| **mariadb** | MariaDB 11; volumen `club360_mariadb_data` |
| **prisma-migrate** (legacy) | Si el compose aún lo incluye, preferir `db:seed` en host en lugar de migraciones Prisma |

### Arranque

```powershell
cd services/database
docker compose up -d
docker compose logs -f mariadb
```

Por defecto: `root` / `root`, base `club360`, puerto host `3306`.

Variables opcionales: copiar `.env.example` → `.env` en esa carpeta.

### Conectar la app

En `backend/.env`:

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=club360
DATABASE_URL=mysql://root:root@127.0.0.1:3306/club360
```

Luego `npm run api` + `npm run web` desde la raíz del repo.

---

## `services/mysql/` — MySQL 8 mínimo

Solo MySQL 8, **sin** job de esquema al arrancar.

```powershell
cd services/mysql
docker compose up -d
```

Credenciales por defecto: `root` / `root`, base `club360`, puerto `3306`.

Después: `cd backend && npm run db:seed`.

---

## Arquitectura

```text
frontend (Vite)  →  HTTP  →  backend (Nest + TypeORM)  →  TCP  →  MariaDB/MySQL
```

- CRUD en runtime: solo API + TypeORM.
- Esquema y demo: `schema_mysql.sql` + `seed_mvp.sql` ([base-de-datos.md](./base-de-datos.md)).

---

## Comparación

| Carpeta | Motor | Seed automático al `up` |
|---------|-------|-------------------------|
| `services/database/` | MariaDB 11 | No (usar `db:seed` en host) |
| `services/mysql/` | MySQL 8 | No |

Más desarrollo: [desarrollo.md](./desarrollo.md).

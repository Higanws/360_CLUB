# Guía de desarrollo

Referencia para **desarrollo local**, **demo** y **reset de base de datos**. Despliegue: [despliegue.md](./despliegue.md). Base de datos: [base-de-datos.md](./base-de-datos.md).

---

## 1. Arquitectura

| Capa | Tecnología | Rol |
|------|------------|-----|
| **Frontend** | React + Vite | Solo HTTP hacia `/api/...` |
| **Backend** | NestJS + TypeORM | API REST; persistencia MySQL/MariaDB |
| **Base de datos** | MariaDB/MySQL | Datos persistentes |
| **Prisma** | `backend/prisma/schema.prisma` | Modelo + `prisma generate`; **no** migraciones en dev/demo |

```text
Navegador → frontend (:5173) → /api → backend (:3000) → MariaDB
```

Toda la CRUD de la app pasa por la API. `synchronize: false` en TypeORM.

---

## 2. Requisitos y configuración

| Herramienta | Versión |
|-------------|---------|
| Node.js | 20+ |
| MariaDB o MySQL | 10.6+ / 8+ |

Copiá `backend/.env.example` → `backend/.env`. Docker opcional: [docker.md](./docker.md).

---

## 3. Arranque local

```powershell
# Terminal 1 — API (:3000)
npm run api

# Terminal 2 — Front (:5173)
npm run web

# Terminal 3 — Túnel demo (opcional)
npm run demo:tunnel
```

- Local: http://localhost:5173
- Health BD (tras instalar): `GET http://localhost:3000/api/health/database`

### Reset de base (dev / demo)

```powershell
cd backend
npm run db:seed
```

Reiniciá el backend después. Ver [base-de-datos.md](./base-de-datos.md).

### Wizard (primera instalación)

1. Sin `backend/data/installed.txt`.
2. `npm run api` + `npm run web` → completar asistente.
3. Reiniciar API para cargar `.env` generado.

Reset wizard: borrar `backend/data/installed.txt` y `.env` generado.

Endpoints: `GET /api/install/status`, `POST /api/install/test-db`, `POST /api/install/run`.

### Scripts raíz

| Comando | Acción |
|---------|--------|
| `npm run api` | Backend `start:dev` |
| `npm run web` | Frontend Vite |
| `npm run build` | Build backend + frontend |
| `npm test` | Tests ambos paquetes |
| `npm run local` | Ayuda PowerShell (`club360.ps1`) |

---

## 4. Reglas de base de datos (obligatorias en dev / demo)

### 4.1 No usar migraciones Prisma en desarrollo

| Entorno | Cómo evoluciona la BD |
|---------|------------------------|
| **Dev / demo** | Queries en la BD levantada + actualizar SQL versionados |
| **Producción** (futuro) | Migraciones Prisma solo si no se puede repetir el wizard |

**Prohibido en dev/demo:** `prisma migrate dev/deploy` para probar tablas; duplicar INSERTs demo fuera de `seed_mvp.sql`.

### 4.2 Cambios: pegar SQL en la BD levantada

1. Probar SQL en MySQL local (Workbench, DBeaver, CLI).
2. Validar API + front.
3. Volcar a `schema_mysql.sql` y/o `seed_mvp.sql` en el mismo PR.

### 4.3 Checklist antes de mergear

| Cambio | Actualizar |
|--------|------------|
| DDL (tabla, columna, FK) | `backend/database/schema/schema_mysql.sql` |
| Datos demo | `backend/database/seed/seed_mvp.sql` |
| Modelo | `backend/prisma/schema.prisma` (recomendado) |
| Runtime | `backend/src/entities/*.entity.ts` + servicios |

- [ ] `npm run db:seed` deja BD coherente
- [ ] `npm run build` y `npm test` OK

### 4.4 Migraciones Prisma — solo producción (futuro)

Cuando el club esté en prod y no sea aceptable vaciar la BD: `prisma migrate deploy` en prod y reflejar el mismo cambio en `schema_mysql.sql` para dev.

---

## 5. Usuarios demo

Ver tabla completa en [base-de-datos.md](./base-de-datos.md). Resumen:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | wizard o `admin` | Administrador |
| `staff` | `staff` | Staff |
| `ana_member` / `luis_member` | `member123` | Socio |

---

## 6. Código

- Módulos Nest por dominio en `backend/src/`.
- Front: `frontend/src/`; roles en `frontend/src/lib/role-access.ts`.
- Portal socio: solo lectura (GET); edición desde gestión.
- Tests: `cd backend && npm test`, `cd frontend && npm test`.
- Tema claro/oscuro: `data-theme` en `frontend/src/index.css`.

### Estructura relevante

```
backend/database/schema/schema_mysql.sql   # DDL
backend/database/seed/seed_mvp.sql         # INSERTs demo
backend/src/infrastructure/persistence/    # TypeORM
backend/prisma/schema.prisma
frontend/src/
services/database/                         # Docker MariaDB
```

### Backend / frontend por paquete

```bash
cd backend && npm run start:dev    # o npm run db:generate / db:seed
cd frontend && npm run dev         # proxy /api → :3000
```

`npm run db:push` — solo prototipo Prisma; evitar en flujo normal.

---

## 7. Demo con túnel

Ver [despliegue.md §1](./despliegue.md#1-demo-rápida-túnel-sin-deploy).

---

*Regla de oro: en dev/demo la BD se cambia con SQL directo; el repo se actualiza en `schema_mysql.sql` y `seed_mvp.sql`.*

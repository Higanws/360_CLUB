# Guía para agentes — Club360

Este documento orienta a agentes de IA (Cursor, MCP, etc.) que trabajen en el repositorio **360_CLUB**. Léelo antes de hacer cualquier cambio.

---

## Regla principal: nunca commitear directamente en `main`

**Toda integración, fix o feature debe hacerse en una rama dedicada.** El agente no mergea a `main`; eso lo hace el usuario.

### Flujo obligatorio

1. **Actualizar `main`** (si hace falta):
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crear una rama** con nombre descriptivo:
   ```bash
   git checkout -b feature/nombre-corto   # nueva funcionalidad
   git checkout -b fix/nombre-corto       # corrección de bug
   git checkout -b chore/nombre-corto     # tareas de mantenimiento
   ```

3. **Implementar los cambios** siguiendo las convenciones de este documento.

4. **Verificar** antes de commitear:
   ```bash
   npm run build
   npm test
   # Si hubo cambios de BD:
   cd backend && npm run db:seed
   ```

5. **Commitear en la rama** (no en `main`):
   ```bash
   git add <archivos relevantes>
   git commit -m "Descripción clara del cambio en español"
   ```

6. **Publicar la rama** en el remoto:
   ```bash
   git push -u origin <nombre-de-la-rama>
   ```

7. **Avisar al usuario** con:
   - Nombre de la rama
   - Resumen de qué cambió y por qué
   - Enlace o instrucción para abrir el PR en GitHub (`github.com/Higanws/360_CLUB`)
   - Recordatorio de que **él debe revisar y mergear** la rama a `main`
   - Si aplica, pasos de prueba manual

### Lo que el agente NO debe hacer

- Commitear ni pushear directamente a `main`
- Hacer merge de la rama (ni local ni remoto)
- Crear tags de release (`v*`) sin que el usuario lo pida
- Forzar push (`git push --force`)
- Saltarse tests o el checklist de BD cuando el cambio lo requiera

### Mensajes de commit

- En **español**, descriptivos y enfocados en el *por qué*
- Prefijos sugeridos: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`

---

## Qué es Club360

**Club360** es un sistema de gestión de gimnasios y clubs deportivos. Réplica moderna de un sistema PHP de referencia.

| Módulo | Descripción |
|--------|-------------|
| Afiliación | Socios, staff, planes de membresía, cobros |
| POS | Punto de venta, inventario, registro de ventas |
| Ejercicios | Catálogo con categorías y videos |
| Entrenamiento | Rutinas y asignaciones a socios |
| Nutrición | Planes alimentarios por socio |
| Control de acceso | Kiosk de recepción + historial |
| Dashboard | Métricas de negocio |
| Portal socio | Solo lectura: dieta y rutina (`/socio/*`) |
| Wizard | Primera instalación (BD + admin) |
| MCP Server | Wrapper REST para agentes y bots |

**Roles:** `administrator`, `staff_member`, `member`.

**Producción:** `https://app.unogym.online` · MCP: `https://mcp.unogym.online`

---

## Arquitectura

Monorepo multi-paquete (sin npm workspaces). Tres aplicaciones independientes orquestadas desde la raíz.

```
Navegador
    │
    ▼
Frontend (React + Vite, :5173)
    │  HTTP /api
    ▼
Backend (NestJS + TypeORM, :3000)
    │
    ▼
MariaDB / MySQL
```

### Capas

| Capa | Tecnología | Ubicación | Rol |
|------|------------|-----------|-----|
| Frontend | React 19, Vite 8, React Router 7, TanStack Query, Axios | `frontend/` | SPA; solo habla con `/api` |
| Backend | NestJS 10, TypeORM, Passport JWT | `backend/` | API REST monolítica modular |
| Base de datos | MariaDB 11 / MySQL 8+ | `backend/database/` | DDL y seed versionados en SQL |
| MCP | Node 20, `@modelcontextprotocol/sdk` | `mcp-server/` | Wrapper sobre la REST API |
| Infra | Docker Compose, GitHub Actions | `deploy/`, `.github/workflows/` | Despliegue en VPS |

### Backend: monolito modular NestJS

- Prefijo global: `/api` (`backend/src/main.ts`)
- Un módulo Nest por dominio de negocio (`members/`, `pos/`, `training/`, etc.)
- Guards globales: JWT + Throttler (120 req/min)
- Capa hexagonal parcial en `backend/src/shared/`:
  - `domain/` — reglas puras
  - `application/ports/` + `*.use-case.ts`
  - `infrastructure/` — adaptadores TypeORM, bcrypt
- Entidades en `backend/src/entities/*.entity.ts`

### Dual ORM (patrón específico del repo)

| Herramienta | Uso |
|-------------|-----|
| **TypeORM** | Runtime de persistencia en Nest (`synchronize: false`) |
| **Prisma** | Modelo tipado + `prisma generate` + seed |
| **SQL versionado** | Fuente de verdad del esquema en dev/demo |

**Prohibido en dev/demo:** `prisma migrate dev` o `prisma migrate deploy`.

### Frontend: SPA con rutas por rol

| Ruta | Acceso |
|------|--------|
| `/gestion/*` | Administrador y staff |
| `/socio/*` | Socio (solo lectura) |
| `/recepcion/control-acceso` | Recepción (sin menú lateral) |
| Wizard | Primera instalación |

- Componentes UI con prefijo `Mm*` (MmInput, MmSelect, MmPageHeader…)
- Roles y permisos: `frontend/src/lib/role-access.ts`
- Cliente API y queries: `frontend/src/lib/`
- Lazy loading de páginas en `frontend/src/App.tsx`

### MCP Server

Servicio aparte que envuelve la REST API de Club360 para agentes (Cursor, Telegram, WhatsApp, etc.). No contiene lógica de negocio propia; solo tools y orquestación sobre `/api`.

---

## Estructura del repositorio

```
360_CLUB/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/            # JWT, login, guards
│   │   ├── members/         # Socios
│   │   ├── staff/           # Personal
│   │   ├── memberships/     # Planes
│   │   ├── membership-payments/
│   │   ├── pos/             # Punto de venta
│   │   ├── activities/      # Ejercicios
│   │   ├── training/        # Rutinas
│   │   ├── nutrition/       # Planes nutricionales
│   │   ├── member-wellness/ # Portal socio (API)
│   │   ├── access-control/  # Control de acceso
│   │   ├── dashboard/       # Métricas
│   │   ├── settings/        # Branding del club
│   │   ├── install/         # Wizard de instalación
│   │   ├── entities/        # Entidades TypeORM
│   │   ├── infrastructure/  # TypeORM factory, artefactos BD
│   │   └── shared/          # DTOs, domain, ports, use-cases
│   ├── database/
│   │   ├── schema/schema_mysql.sql   # DDL (24 tablas MVP)
│   │   └── seed/seed_mvp.sql         # Datos demo
│   └── prisma/schema.prisma
├── frontend/                # SPA React + Vite
│   ├── src/pages/           # Pantallas por dominio
│   ├── src/components/      # UI (mm-*, auth, ui/)
│   ├── src/lib/             # API client, queries, paginación
│   └── src/config/          # Rutas y feature flags
├── mcp-server/              # MCP para agentes
│   ├── src/tools/           # Tools por dominio
│   └── resources/           # Guías markdown
├── deploy/                  # Docker Compose producción/VPS
│   ├── docker-compose.yml
│   └── vps-deploy.sh
├── services/                # Docker solo-BD para dev
├── docs/                    # Documentación unificada (español)
└── scripts/release-tag.sh   # Crear y pushear tag v*
```

---

## Convenciones de desarrollo

### Cambios de base de datos

1. Probar el SQL en la BD local (Workbench, DBeaver, CLI).
2. Validar API + frontend.
3. Volcar en el mismo PR/rama:
   - `backend/database/schema/schema_mysql.sql` (DDL)
   - `backend/database/seed/seed_mvp.sql` (datos demo, si aplica)
   - `backend/prisma/schema.prisma`
   - `backend/src/entities/*.entity.ts` + servicios afectados
4. Verificar: `npm run db:seed`, `npm run build`, `npm test`

### Código

- Toda CRUD pasa por `/api`; el frontend **nunca** accede a la BD directamente
- DTOs con `class-validator` en `dto/*.dto.ts`
- Paginación: `backend/src/shared/dto/pagination-query.dto.ts` y `frontend/src/lib/pagination.ts`
- Tests separados en `test/infra/` (utilidades) y `test/modules/` (dominio)
- Formato: Prettier con single quotes y trailing commas

### Arranque local

```bash
# Requisitos: Node 20+, MariaDB/MySQL, backend/.env desde .env.example

npm run api    # Backend :3000
npm run web    # Frontend :5173
```

Primera instalación: abrir http://localhost:5173 y completar el wizard.  
Reset demo: `cd backend && npm run db:seed`

### Usuarios demo (tras seed)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | wizard o `admin` | Administrador |
| `staff` | `staff` | Staff |
| `ana_member` / `luis_member` | `member123` | Socio |

### Tests

```bash
npm test                    # backend + frontend
npm run test:infra          # utilidades
npm run test:modules        # dominio
cd mcp-server && npm test   # MCP
```

---

## Despliegue y versionado

```
Rama feature/fix → merge a main (usuario) → tag vX.Y.Z → GitHub Actions → VPS
```

- **Rama de desarrollo:** `main`
- **Producción en VPS:** se actualiza con **tags `v*`** (SemVer), no con cada commit
- Workflow: `.github/workflows/deploy-vps.yml`
- Script de release: `scripts/release-tag.sh`
- Documentación: `docs/versionado.md`, `docs/despliegue.md`

El agente **no crea tags ni despliega** salvo que el usuario lo pida explícitamente.

---

## Documentación de referencia

| Documento | Contenido |
|-----------|-----------|
| [`docs/README.md`](docs/README.md) | Índice de toda la documentación |
| [`docs/desarrollo.md`](docs/desarrollo.md) | Arranque local, reglas de BD, wizard |
| [`docs/base-de-datos.md`](docs/base-de-datos.md) | Artefactos SQL, flujos wizard/seed |
| [`docs/despliegue.md`](docs/despliegue.md) | Demo con túnel y VPS |
| [`docs/docker.md`](docs/docker.md) | `deploy/` vs `services/` |
| [`docs/versionado.md`](docs/versionado.md) | Tags, GitHub Actions, `vps-deploy.sh` |
| [`docs/guia-usuario.md`](docs/guia-usuario.md) | Manual funcional para el club |
| [`docs/mcp-server.md`](docs/mcp-server.md) | MCP en producción |
| [`mcp-server/resources/`](mcp-server/resources/) | Guías de dominio para agentes MCP |

---

## Checklist rápido para el agente

- [ ] Trabajo en rama propia (no en `main`)
- [ ] Cambios mínimos y enfocados en la tarea
- [ ] Convenciones del repo respetadas (nombres, estructura, ORM dual)
- [ ] Si hay cambio de BD: SQL versionado + Prisma + entidades TypeORM
- [ ] `npm run build` y `npm test` pasan
- [ ] Rama publicada con `git push -u origin <rama>`
- [ ] Usuario avisado para revisar y mergear

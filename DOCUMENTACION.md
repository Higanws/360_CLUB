# Club360 — Documentación unificada

Sistema de gestión de gimnasios (**React + NestJS + Prisma + MariaDB**).  
Repo: [github.com/Higanws/360_CLUB](https://github.com/Higanws/360_CLUB) · Prod: `https://app.unogym.online` · MCP: `https://mcp.unogym.online`

| | |
|---|---|
| Este archivo | **Única documentación humana** del proyecto |
| `AGENTS.md` | Puntero corto para agentes (Cursor); las reglas completas están aquí |
| `mcp-server/resources/*` | Guías runtime del MCP (no duplicar aquí) |

---

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Arranque local](#2-arranque-local)
3. [Base de datos (Prisma) y backups](#3-base-de-datos-prisma-y-backups)
4. [Docker](#4-docker)
5. [Despliegue y versionado](#5-despliegue-y-versionado)
6. [Módulos, roles y uso](#6-módulos-roles-y-uso)
7. [MCP y bots](#7-mcp-y-bots)
8. [Operación y escalabilidad](#8-operación-y-escalabilidad)
9. [Reglas para agentes](#9-reglas-para-agentes)

---

## 1. Arquitectura

Monorepo multi-paquete (sin npm workspaces): `backend/`, `frontend/`, `mcp-server/`, capa BD en `services/database/`, stack VPS en `deploy/`.

### Diagrama

```mermaid
flowchart TB
  subgraph clients [Clientes]
    Browser[Navegador]
    Bots[Bots Telegram / WhatsApp]
    Agents[Agentes Cursor / MCP]
  end

  subgraph appHost [App]
    Web["Frontend React + Vite\n:5173 local / Nginx :8080"]
    API["Backend NestJS + Prisma\n:3000 /api"]
    MCP["MCP Server\n:3100"]
  end

  subgraph dbLayer ["Capa BD — un contenedor club360-db"]
    Maria[MariaDB]
    Cron[supercronic backup semanal]
    Migrate["prisma-migrate\n(one-shot al up)"]
  end

  HostBackups["Host: ./Backups/\nclub360_*.sql.gz"]

  Browser --> Web
  Web -->|"HTTP /api"| API
  API --> Maria
  Migrate -->|"migrate deploy"| Maria
  Cron -->|"mariadb-dump"| HostBackups
  Maria -.->|"bind /backups"| HostBackups
  API -->|"POST /api/admin/backups"| HostBackups
  Bots --> MCP
  Agents --> MCP
  MCP -->|"REST /api"| API
```

### Capas

| Capa | Tecnología | Ubicación | Rol |
|------|------------|-----------|-----|
| Frontend | React 19, Vite, React Router, TanStack Query | `frontend/` | SPA; solo habla con `/api` |
| Backend | NestJS 10, **Prisma** (runtime), Passport JWT | `backend/` | API REST monolítica modular |
| BD | MariaDB 11 en Docker unificado | `services/database/` | Datos + cron de backups |
| Esquema | Prisma Migrate | `backend/prisma/` | Fuente de verdad del DDL |
| MCP | `@modelcontextprotocol/sdk` | `mcp-server/` | Wrapper REST para agentes/bots |
| Deploy | Docker Compose + GitHub Actions | `deploy/` | VPS por tags `v*` |

### Rutas frontend

| Ruta | Acceso |
|------|--------|
| `/gestion/*` | Administrador y staff |
| `/socio/*` | Socio (solo lectura) |
| `/recepcion/control-acceso` | Kiosk recepción |

Roles: `administrator`, `staff_member`, `member`.

---

## 2. Arranque local

**Requisitos:** Node 20+, Docker (para la BD).

```bash
# 1) Base de datos (contenedor único + migrate)
npm run db:up

# 2) Seed demo
cd backend && npm run db:seed && cd ..
# Marcar instalado si hace falta: touch backend/data/installed.txt backend/data/.installed

# 3) App
npm run api    # :3000
npm run web    # :5173
```

`backend/.env` (alineado con Docker):

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=club360
DATABASE_URL=mysql://root:root@127.0.0.1:3306/club360
JWT_SECRET=dev-local-secret-minimo-32-caracteres-ok
FRONTEND_URL=http://localhost:5173
```

Health: `GET http://localhost:3000/api/health/database`  
Primera instalación alternativa: wizard en http://localhost:5173 (sin marcadores `installed`).

### Usuarios demo (tras seed)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin` | Administrador |
| `staff` | `staff` | Staff |
| `ana_member` / `luis_member` | `member123` | Socio |

### Scripts raíz

| Comando | Acción |
|---------|--------|
| `npm run api` / `web` | Backend / frontend |
| `npm run build` / `test` | Build y tests |
| `npm run db:up` / `db:down` | Levantar / parar capa BD |
| `npm run db:backup` | Dump inmediato → `Backups/` |
| `npm run demo:tunnel` | Túnel Cloudflare al front |
| `npm run mcp` | MCP en desarrollo |

---

## 3. Base de datos (Prisma) y backups

### Fuente de verdad

1. Editar `backend/prisma/schema.prisma`
2. `cd backend && npm run db:migrate` (dev) o dejar que `prisma-migrate` aplique en Docker
3. Actualizar `prisma/seed.ts` si cambian datos demo
4. Verificar: `npm run db:migrate:deploy`, `npm run db:seed`, `npm run build`, `npm test`

**No** usar TypeORM ni SQL versionado (`schema_mysql.sql`) como fuente de esquema. El DDL legacy, si existe, es solo referencia histórica.

### Contenedor unificado `club360-db`

- MariaDB (datos en volumen Docker)
- supercronic: backup **domingo 03:00 UTC**, retención **8** dumps
- Bind mount → **`/opt/backup` en el VPS** (fuera del repo y fuera del contenedor)
- Job one-shot `prisma-migrate` al hacer `up` (no queda corriendo)

### API de backups (solo `administrator`)

Durante backup/restore: Prisma se desconecta, MariaDB pasa a `read_only`, el resto de `/api` responde **503**. La SPA sigue arriba. **No hay cola offline**: el cliente debe reintentar cuando `mode: open`.

| Método | Ruta | Efecto |
|--------|------|--------|
| `GET` | `/api/admin/backups/status` | Estado de mantenimiento |
| `GET` | `/api/admin/backups` | Lista archivos en `BACKUP_DIR` (en VPS: `/opt/backup`) |
| `POST` | `/api/admin/backups` | Generar dump |
| `POST` | `/api/admin/backups/restore` | Multipart `file` o `{ "filename": "club360_….sql.gz" }` |

También: `npm run db:backup` (CLI / Docker exec).

---

## 4. Docker

### Solo BD (desarrollo)

```bash
npm run db:up
# App en el host: npm run api + npm run web
```

### Stack completo (VPS / demo)

```bash
cd deploy
cp .env.example .env   # JWT_SECRET, contraseñas, FRONTEND_URL
docker compose up -d --build
```

| Puerto | Servicio |
|--------|----------|
| `8080` | App (Nginx → SPA + `/api`) |
| `9000` | Portainer |
| `127.0.0.1:3100` | MCP |

Servicios: `db` (MariaDB+backups), `api`, `web`, `redis`, `portainer`, `mcp`.  
En prod, **3306 no se publica** al host. Backups → `../Backups` en el host del VPS.

`services/mysql/` es legacy; preferí `services/database/`.

---

## 5. Despliegue y versionado

```text
Rama feature/fix → merge a main (humano) → tag vX.Y.Z → GitHub Actions → VPS
```

- Tags anotados SemVer: `vMAJOR.MINOR.PATCH`
- Workflow: `.github/workflows/deploy-vps.yml` → `deploy/vps-deploy.sh <ref>`
- Secrets: `VPS_HOST`, `VPS_SSH_KEY`, `VPS_USER`
- Script local de release: `scripts/release-tag.sh`
- **Producción se actualiza con tags**, no con cada commit

Demo rápida sin VPS: `npm run api` + `npm run web` + `npm run demo:tunnel`.

---

## 6. Módulos, roles y uso

| Módulo | Descripción |
|--------|-------------|
| Afiliación | Socios, staff, planes, cobros |
| POS | Venta e inventario |
| Ejercicios | Catálogo + videos |
| Entrenamiento | Rutinas y asignaciones |
| Nutrición | Planes alimentarios |
| Control de acceso | Kiosk + historial |
| Dashboard | Métricas |
| Portal socio | Dieta y rutina (lectura) |
| Wizard | Primera instalación |
| MCP | Tools para agentes/bots |

**Admin:** gestión completa. **Staff:** operativa (socios asignados). **Socio:** `/socio/*` sin escritura.

UI gestión: prefijo de componentes `Mm*` · permisos en `frontend/src/lib/role-access.ts`.

---

## 7. MCP y bots

- MCP **no** tiene lógica de negocio: envuelve la REST API.
- Producción: Bearer `MCP_HTTP_BEARER_TOKEN`; health `/health`.
- Telegram/WhatsApp: bot aparte con webhook HTTPS → cliente MCP HTTP → API Club360. El MCP **no** recibe webhooks directamente.
- Resources en `mcp-server/resources/` (`club360://guide/*`).

---

## 8. Operación y escalabilidad

- Paginación compartida (`page` / `pageSize`, máx. 500)
- Caché: Redis (`REDIS_URL`) o in-memory; dashboard ~120s; branding ~300s
- Throttling global: 120 req/min
- JWT stateless (escala horizontal sin sticky sessions)
- Export CSV POS: ventana máxima 90 días
- Backups: semanales + API; sin cola de requests durante mantenimiento

---

## 9. Reglas para agentes

### Git (obligatorio)

1. Trabajar en rama `feature/…`, `fix/…` o `chore/…` (nunca commit directo a `main`)
2. Verificar: `npm run build`, `npm test`, y si hubo BD: `npm run db:seed`
3. Commitear en la rama (mensajes en **español**, prefijos `feat:` / `fix:` / `chore:` …)
4. Publicar: `git push -u origin <rama>`
5. **Avisar al usuario** para que revise y mergee; el agente **no** mergea ni crea tags `v*` ni hace force-push

### Código

- Toda CRUD pasa por `/api`; el front no toca la BD
- Cambios de esquema: Prisma Migrate + seed + docs en este archivo si cambia el flujo
- DTOs con `class-validator`; tests en `test/infra/` y `test/modules/`
- MCP: solo wrappers; no meter reglas de negocio ahí

### Checklist

- [ ] Rama propia (no `main`)
- [ ] Cambios mínimos y enfocados
- [ ] Prisma / migraciones / seed si aplica
- [ ] `build` + `test` OK
- [ ] Rama publicada
- [ ] Usuario avisado para merge

---

*Documento vivo: cualquier guía nueva debe ir aquí, no en MDs sueltos.*

# Docker

Hay dos modos: **solo base de datos** (desarrollo en host) y **stack completo** (VPS / pruebas con todo en contenedores).

---

## Stack completo (recomendado para VPS)

Carpeta [`deploy/`](../deploy/README.md): API + frontend (Nginx) + MariaDB + job de seed + **Portainer** (UI de gestión en el puerto `9000`).

```bash
cd deploy
cp .env.example .env
# Editar JWT_SECRET, contraseñas y FRONTEND_URL=http://<IP-VPS>:8080
docker compose up -d --build
```

| Puerto (por defecto) | Servicio |
|----------------------|----------|
| `8080` | App Club360 (navegador) |
| `9000` | Portainer (contenedores, logs, reinicios) |

MariaDB **no** se publica al host; solo la red interna `club360`.

Arquitectura:

```text
Navegador → web:80 (Nginx) ─┬─ /     → SPA (Vite build)
                            └─ /api  → api:3000 (NestJS) → mariadb:3306

Portainer → docker.sock (gestión del host Docker)
```

Detalle de variables y seguridad: [deploy/README.md](../deploy/README.md).

---

## Solo base de datos (desarrollo local)

Contenedores en `services/`. Esquema y demo en host con `npm run db:seed`.

### `services/database/` — MariaDB 11

```powershell
cd services/database
docker compose up -d
```

Por defecto: `root` / `root`, base `club360`, puerto `3306`.

En `backend/.env`:

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=club360
DATABASE_URL=mysql://root:root@127.0.0.1:3306/club360
```

Luego desde la raíz: `npm run api` + `npm run web`.

### `services/mysql/` — MySQL 8 mínimo

```powershell
cd services/mysql
docker compose up -d
cd backend
npm run db:seed
```

---

## Comparación

| Modo | Uso |
|------|-----|
| `deploy/docker-compose.yml` | VPS, demo en servidor, Portainer incluido |
| `services/database/` | Dev: solo BD en Docker, API/frontend en Node local |
| `services/mysql/` | Dev: MySQL 8 sin seed automático |

Más despliegue clásico (sin Docker): [despliegue.md](./despliegue.md).  
Desarrollo diario: [desarrollo.md](./desarrollo.md).

# Despliegue Docker (VPS y pruebas locales)

Stack listo para levantar **MariaDB + API + frontend (Nginx)** y **Portainer** (interfaz web de gestión de contenedores).

## Requisitos

- Docker Engine 24+ y Docker Compose v2
- En el VPS: puertos libres `8080` (app) y `9000` (Portainer), salvo que los cambies en `.env`

## Arranque rápido

```bash
cd deploy
cp .env.example .env
# Editar .env: JWT_SECRET, MARIADB_ROOT_PASSWORD, FRONTEND_URL (IP o dominio del VPS)

docker compose up -d --build
docker compose ps
```

Desde tu PC:

| Servicio | URL por defecto |
|----------|-----------------|
| **Club360** | `http://<IP-del-VPS>:8080` |
| **Portainer** | `http://<IP-del-VPS>:9000` |

La primera vez en Portainer creás usuario admin local (solo para gestionar Docker en ese servidor).

## Qué hace cada contenedor

| Contenedor | Rol |
|------------|-----|
| `club360-mariadb` | Base de datos persistente |
| `club360-api` | NestJS en `:3000` (red interna); el **wizard** aplica esquema y seed |
| `club360-web` | Nginx: SPA + proxy `/api` → API |
| `club360-portainer` | UI para ver logs, reiniciar servicios, volúmenes, etc. |

Tras completar el asistente, la API **se reinicia sola** (`CLUB360_DOCKER=1`) y la app continúa sin pasos manuales.

## Comandos útiles

```bash
docker compose logs -f api
docker compose logs -f web
docker compose restart api
docker compose down          # para contenedores; datos en volúmenes
docker compose down -v       # ¡borra volúmenes y la BD!
```

## Seguridad en el VPS (cuando configures el servidor)

- Cambiar todas las contraseñas de `.env`
- Restringir en firewall: solo tus IPs a `9000` (Portainer) si es posible
- No exponer MariaDB (`3306`) a Internet
- Más adelante: reverse proxy (Caddy/Nginx) + HTTPS delante de `web`

## Wizard vs instalación automática

- `CLUB360_AUTO_INSTALL=0` (por defecto): el asistente web aplica `schema_mysql.sql` y `seed_mvp.sql`
- `CLUB360_AUTO_INSTALL=1`: salta el wizard y marca la instalación hecha (solo si la BD ya está lista)

Documentación ampliada: [docs/docker.md](../docs/docker.md).

## Releases y VPS (tags Git)

Cada tag `v*` (ej. `v1.0.0`) puede desplegar automáticamente en el VPS vía GitHub Actions. Ver [docs/versionado.md](../docs/versionado.md) y el script `deploy/vps-deploy.sh`.

## MCP + Cloudflare (`mcp.unogym.online`)

Agentes remotos (Telegram, etc.): [docs/mcp-server.md](../docs/mcp-server.md). Plantilla túnel: `cloudflared-config.example.yml`, script `setup-cloudflare-mcp.sh`.

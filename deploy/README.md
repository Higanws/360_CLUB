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
| `club360-db-init` | Job único: `schema_mysql.sql` + `seed_mvp.sql` |
| `club360-api` | NestJS en `:3000` (red interna) |
| `club360-web` | Nginx: SPA + proxy `/api` → API |
| `club360-portainer` | UI para ver logs, reiniciar servicios, volúmenes, etc. |

Credenciales demo tras el seed: ver [base-de-datos.md](../docs/base-de-datos.md) (usuario `admin` / `admin` si aplica al seed).

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

- `CLUB360_AUTO_INSTALL=1` (por defecto): tras `db-init`, la API arranca ya “instalada”
- `CLUB360_AUTO_INSTALL=0`: podés usar el asistente web; conviene no ejecutar seed automático o vaciar la BD antes

Documentación ampliada: [docs/docker.md](../docs/docker.md).

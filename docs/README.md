# Documentación Club360

Índice de la documentación del proyecto. El código vive en `backend/`, `frontend/` y `backend/database/`; aquí está todo lo operativo y de reglas de equipo.

| Documento | Para quién | Contenido |
|-----------|------------|-----------|
| **[desarrollo.md](./desarrollo.md)** | Desarrolladores | Arranque local, reglas de BD, `db:seed`, wizard, comandos, usuarios demo |
| **[despliegue.md](./despliegue.md)** | DevOps / demo | Túnel Cloudflare (`demo:tunnel`) y despliegue en VPS |
| **[base-de-datos.md](./base-de-datos.md)** | Desarrolladores | `schema_mysql.sql`, `seed_mvp.sql`, flujos wizard y reset |
| **[docker.md](./docker.md)** | DevOps / VPS | Stack completo en `deploy/` + Portainer; BD suelta en `services/` |
| **[guia-usuario.md](./guia-usuario.md)** | Personal del club | Uso funcional de la app (recepción, admin, staff) |
| **[mcp-server.md](./mcp-server.md)** | Integradores / bots | MCP en producción (`mcp.unogym.online`) |
| **[mcp-webhooks-telegram-whatsapp.md](./mcp-webhooks-telegram-whatsapp.md)** | Bots | Webhook Telegram/WhatsApp + cliente MCP |

## Visión rápida

Club360 es una réplica moderna (**React + NestJS + MariaDB/MySQL**) del sistema PHP de referencia. La API persiste solo en base de datos vía **TypeORM** (`synchronize: false`). **Prisma** modela el dominio y genera cliente; en dev/demo **no** se usan migraciones.

```text
Navegador → frontend (Vite) → HTTP /api → backend (NestJS) → MariaDB/MySQL
```

## Enlaces rápidos

- Repo: [github.com/Higanws/360_CLUB](https://github.com/Higanws/360_CLUB)
- Arranque: `npm run api` + `npm run web` (desde la raíz del repo)
- Reset BD demo: `cd backend && npm run db:seed`
- Variables: `backend/.env.example`, `frontend/.env.example`, `deploy/.env.example`
- Docker VPS: `cd deploy && docker compose up -d --build`

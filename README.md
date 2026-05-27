# Club360

Sistema de gestión de gimnasios (**React + NestJS + MariaDB/MySQL**).

## Documentación

Toda la documentación está en **[`docs/`](./docs/README.md)**:

| Guía | Descripción |
|------|-------------|
| [docs/desarrollo.md](./docs/desarrollo.md) | Arranque local, reglas de BD, `db:seed`, wizard |
| [docs/despliegue.md](./docs/despliegue.md) | Demo con túnel y VPS |
| [docs/base-de-datos.md](./docs/base-de-datos.md) | `schema_mysql.sql` y `seed_mvp.sql` |
| [docs/docker.md](./docs/docker.md) | MariaDB/MySQL en Docker |
| [docs/guia-usuario.md](./docs/guia-usuario.md) | Manual para personal del club |

## Inicio rápido

```powershell
# Requisitos: Node 20+, MariaDB/MySQL, backend/.env desde .env.example
npm run api    # API :3000
npm run web    # Front :5173
```

Primera vez sin instalar: abrir http://localhost:5173 y completar el **wizard**.  
Reset de datos demo: `cd backend && npm run db:seed`

## Estructura del repo

```
backend/          # API NestJS + TypeORM
frontend/         # React + Vite
backend/database/ # SQL de esquema y seed (fuente de verdad en dev)
docs/             # Documentación unificada
services/         # Docker (MariaDB / MySQL)
```

## Licencia y repo

[github.com/Higanws/360_CLUB](https://github.com/Higanws/360_CLUB)

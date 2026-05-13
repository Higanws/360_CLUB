# Servicio: base de datos (MariaDB + Prisma)

Stack **independiente** del backend Nest y del frontend Vite. Arráncalo antes (o en paralelo) de la API para tener MySQL escuchando y el esquema aplicado con **Prisma Migrate**.

## Qué hace

| Componente | Rol |
|------------|-----|
| **mariadb** | Servidor MariaDB 11; datos en volumen Docker `club360_mariadb_data` (persisten entre apagados). La primera vez crea la base definida en `MARIADB_DATABASE`. |
| **prisma-migrate** | Contenedor de un solo uso: ejecuta `prisma migrate deploy` usando `../../backend/prisma/`. Crea/actualiza tablas según `migrations/`. Es idempotente: en siguientes arranques solo aplica migraciones pendientes. |

## Requisitos

- Docker Desktop (o Docker Engine + Compose v2)
- Carpeta `../../backend/prisma` con migraciones (el build copia el árbol al crear la imagen `prisma-migrate`)

Si **añades o cambias migraciones**, vuelve a construir la imagen:

```bash
docker compose build prisma-migrate --no-cache
docker compose up -d
```

O, desde la máquina host (sin reconstruir la imagen), aplica migraciones con el mismo `DATABASE_URL` apuntando a `127.0.0.1`:

```bash
cd ../../backend
set DATABASE_URL=mysql://root:root@127.0.0.1:3306/club360
npx prisma migrate deploy
```

## Arranque

```powershell
cd services/database
docker compose up -d
docker compose logs -f prisma-migrate   # ver resultado del migrate (una vez)
docker compose logs -f mariadb
```

Estado:

```bash
docker compose ps
```

## Variables (opcional)

Copia `.env.example` a `.env`. `DB_PORT` cambia el mapeo en el host si 3306 está ocupado.

## Arquitectura del proyecto

```
frontend (Vite)  →  HTTP  →  backend (Nest + TypeORM)  →  TCP  →  MariaDB
                                                    ↑
                              Prisma solo para migraciones / seed en desarrollo
```

- **CRUD en producción:** el navegador **solo** habla con la **API REST** (`/api/...`). El backend usa **TypeORM** contra MariaDB.
- **Prisma** en este repo **no** sirve como cliente HTTP; versiona el DDL (`migrate`) y opcionalmente `db seed` desde `backend/`.

## Otros stacks Docker en este repo

- **`services/mysql/`** — solo MySQL 8, sin job Prisma al arrancar.
- **`database/`** (en la raíz del proyecto) — SQL de esquema y seeds versionados, no son un servicio en ejecución.

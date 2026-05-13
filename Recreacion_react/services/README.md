# Servicios (Docker / infra)

Cada subcarpeta es **un servicio** autocontenido con su `docker-compose` y documentación.

| Carpeta | Contenido |
|---------|-----------|
| **`database/`** | MariaDB 11 + job Prisma migrate (recomendado para desarrollo). |
| **`mysql/`** | Solo MySQL 8 en Docker (mínimo, sin migrate automático). |

La definición SQL versionada del modelo sigue en **`../database/`** (schema, seed, ops), no aquí: esa carpeta son **artefactos**, no un contenedor.

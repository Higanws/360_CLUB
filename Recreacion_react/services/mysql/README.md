# Servicio: MySQL 8 (Docker mínimo)

Solo levanta **MySQL 8** con volumen persistente. **No** ejecuta Prisma al iniciar.

Para **MariaDB + `prisma migrate deploy`** al subir el stack, usa el servicio vecino **`../database`** (carpeta `services/database`, no confundir con `database/` de la raíz del repo, que solo contiene SQL versionado).

```powershell
cd services/mysql
docker compose up -d
```

Credenciales por defecto en el compose: `root` / `root`, base `club360`, puerto host `3306`.

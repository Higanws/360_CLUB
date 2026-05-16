# Escalabilidad y operación (Club360)

Este documento resume **mejoras recomendadas** que no forman parte del MVP actual, y cómo aplicar **índices** en bases de datos ya existentes.

## Paginación de socios (implementado)

- **API:** `GET /api/members?page=1&pageSize=25` (máximo `pageSize=500`).
- **Respuesta:** `meta.total`, `meta.page`, `meta.pageSize`, `meta.pageCount`.
- **Front:** la lista principal de socios usa paginación; los desplegables que necesitan todos los socios llaman a `fetchAllMembersLiteRows()` en `frontend/src/lib/members-api.ts` (varias páginas automáticas).

### Próximos listados candidatos a paginar

- Planes de membresía, cobros, productos POS, actividades, rutinas, asignaciones, etc., si crecen mucho.
- Añadir **búsqueda server-side** (por nombre, DNI, usuario) en el listado de socios cuando haga falta.

## Índices en `gym_member`

En **`backend/database/schema/schema_mysql.sql`** el `CREATE TABLE gym_member` incluye:

| Índice | Columnas | Uso aproximado |
|--------|----------|----------------|
| `idx_gym_member_assign_staff` | `assign_staff_mem` | Staff: socios asignados al entrenador |
| `idx_gym_member_name` | `first_name`, `last_name` | Ordenación del listado paginado |
| `idx_gym_member_username` | `username` | Login por usuario |

**Nota:** el filtro `LOWER(TRIM(role_name)) = 'member'` sigue siendo costoso mientras `role_name` sea `TEXT`; a medio plazo conviene **normalizar** rol en columna `VARCHAR` indexable o un índice funcional en MySQL 8+.

### Bases ya desplegadas (sin recrear tablas)

Ejecutar **una vez** en MySQL (error `1061 Duplicate key name` = índice ya existe, omitir):

```sql
ALTER TABLE `gym_member` ADD INDEX `idx_gym_member_assign_staff` (`assign_staff_mem`);
ALTER TABLE `gym_member` ADD INDEX `idx_gym_member_name` (`first_name`, `last_name`);
ALTER TABLE `gym_member` ADD INDEX `idx_gym_member_username` (`username`);
```

Al final de `schema_mysql.sql` hay los mismos `ALTER` comentados como referencia.

## Throttling (Nest)

- Configuración global en `app.module.ts` (`ThrottlerModule`).
- Ajustar `limit` / `ttl` según número de usuarios y si hay **proxy** (IP real en `X-Forwarded-For`).
- Valorar **límites por ruta** (login más estricto, lecturas más laxas).

## Pool de conexiones MySQL

- TypeORM usa el pool del driver; en producción conviene fijar límites vía URL o opciones (`extra` en `TypeOrmModule`) según RAM del servidor y `max_connections` de MySQL.

## Caché y lecturas repetidas

- **Redis** (o caché en memoria) para sesiones, branding, catálogos poco cambiantes, si el tráfico lo justifica.
- **CDN** para estáticos del front y ficheros subidos (`VITE_UPLOAD_BASE`), si aplica.

## Horizontal y alta disponibilidad

- Varios **instancias** del API Nest detrás de un balanceador (sticky sessions no necesarias para JWT stateless).
- **Sesiones** y almacenamiento de archivos compartidos o en objeto (S3/minio).
- **Colas** (BullMQ, etc.) para informes pesados o envío de correos.

## Observabilidad

- Logs estructurados, métricas (Prometheus), trazas (OpenTelemetry), alertas sobre latencia y errores 5xx.

## UI móvil vs gestión

- **Portal del socio** (`/socio/...`): pensado para uso en móvil.
- **Gestión y staff** (`/gestion/...`): uso previsto en **portátil o tablet grande**; no es un requisito que todo el backoffice sea óptimo en teléfono pequeño.

---

*Última actualización: alineado con paginación de socios e índices en esquema MVP.*

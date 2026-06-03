# Escalabilidad y operación (Club360)

Este documento resume **mejoras recomendadas** que no forman parte del MVP actual, y cómo aplicar **índices** en bases de datos ya existentes.

## Paginación (implementado)

Contrato compartido: `backend/src/shared/dto/pagination-query.dto.ts`, `paginated-meta.ts` y `frontend/src/lib/pagination.ts`.

| Endpoint | Parámetros | Respuesta |
|----------|------------|-----------|
| `GET /api/members` | `page`, `pageSize` (máx. 500) | `{ members, meta }` |
| `GET /api/members/search` | `q`, `limit` | `{ members, total }` — comboboxes (mín. 2 chars en UI) |
| `GET /api/pos/sales` | `from`, `to`, `page`, `pageSize` | `{ sales, meta }` |
| `GET /api/access-control/recent` | `from`, `to`, `page`, `pageSize` | `{ logs, meta }` |
| `GET /api/nutrition/overview` | `page`, `pageSize`, `q?` | `{ rows, meta }` — `meal_count` vía `JSON_LENGTH`, sin cargar JSON |
| `GET /api/training-assignments` | `page`, `pageSize`, `q?` | `{ assignments, meta }` |
| `GET /api/activities` | `page`, `pageSize` | `{ activities, meta }` |
| `GET /api/training-routines` | `page`, `pageSize` | `{ routines, meta }` |
| `GET /api/staff` | `page`, `pageSize` | `{ staff, meta }` |
| `GET /api/payments/membership/expiring-this-month` | `page`, `pageSize` | `{ rows, meta, title, subtitle }` |
| `GET /api/payments/membership/form-options` | `q?`, `limit?` | socios solo con `q`; planes siempre |

- **Front:** comboboxes usan `searchMembersLite()`; listados con paginación UI; React Query en socios, dashboard, staff, actividades, rutinas, cobros.
- **Export CSV POS:** `GET /api/pos/sales/export` — listado completo del rango (máx. 90 días).

## Caché

- **In-memory / Redis:** `CacheModule` global; `REDIS_URL` en Docker (`redis://redis:6379`).
- Dashboard métricas: TTL 120 s (`dashboard:business-metrics`).
- Branding login: TTL 300 s (`settings:club-branding`).
- Fallback in-memory si Redis no está disponible.

## Índices adicionales

En `schema_mysql.sql` y migración `backend/database/migrations/add-performance-indexes.sql`:

| Índice | Tabla | Uso |
|--------|-------|-----|
| `idx_membership_payment_end_date` | `membership_payment` | Cobros del mes |
| `idx_club_access_log_date_outcome` | `club_access_log` | Dashboard + registro accesos |
| `idx_pos_sale_created` | `pos_sale` | Ventas (ya existía); consultas por rango datetime |

### Próximos listados candidatos a paginar

- Planes de membresía (baja prioridad, catálogo pequeño).

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

# Guía para agentes — Club360

La documentación y reglas de trabajo están unificadas en:

**→ [`DOCUMENTACION.md`](./DOCUMENTACION.md)** (especialmente §1 Arquitectura y §9 Reglas para agentes)

Resumen mínimo:

- Nunca commitear ni pushear a `main`; usar rama `feature|fix|chore/…`, publicar y avisar al usuario para el merge.
- Esquema y runtime de BD: **Prisma** (`migrate` + `PrismaService`).
- Backups: contenedor `club360-db` + `Backups/` en el host + API `/api/admin/backups/*`.
- Verificar con `npm run build` y `npm test` antes de pushear.

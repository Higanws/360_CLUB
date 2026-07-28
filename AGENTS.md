# Guía para agentes — Club360

La documentación y reglas de trabajo están unificadas en:

**→ [`DOCUMENTACION.md`](./DOCUMENTACION.md)** (especialmente §1 Arquitectura y §9 Reglas para agentes)

Resumen mínimo:

- Nunca commitear ni pushear a `main`; usar rama `feature|fix|chore/…`, publicar y avisar al usuario para el merge.
- Esquema y runtime de BD: **Prisma** (`migrate` + `PrismaService`).
- Backups: contenedor `club360-db` + `/opt/backup` en el host + API `/api/admin/backups/*`.
- Verificar con `npm run build` y `npm test` antes de pushear.

---

## Despliegue en VPS (producción)

Detalle completo: [`DOCUMENTACION.md`](./DOCUMENTACION.md) §5 y [`docs/versionado.md`](./docs/versionado.md).

### Flujo normal (preferido)

```text
rama feature/fix → merge a main (humano) → tag anotado vX.Y.Z → push del tag
       ↓
GitHub Actions (.github/workflows/deploy-vps.yml)
       ↓
SSH al VPS → /opt/360_CLUB/deploy/vps-deploy.sh vX.Y.Z
```

1. Merge en `main` (humano o cuando el usuario lo pida explícitamente).
2. Tag anotado SemVer y push:
   ```bash
   git tag -a v1.6.1 -m "Release 1.6.1: …"
   git push origin v1.6.1
   ```
   O: `./scripts/release-tag.sh 1.6.1 "mensaje"`.
3. El workflow **Deploy VPS** se dispara solo con tags `v*` (también `workflow_dispatch` manual).
4. En el VPS, `vps-deploy.sh`:
   - `git fetch` + checkout del tag/rama (`origin/<ref>` si existe)
   - Escribe `/opt/360_CLUB/VERSION`
   - `docker compose up -d --build db redis api web mcp`  
     (servicio BD = **`db`** / `club360-db` desde v1.6; no usar `mariadb`)

### Deploy manual (si Actions falla o hay urgencia)

```bash
ssh -i /Users/Personal/Downloads/cloudflare.pem root@187.33.154.45
# o desde local:
ssh -i /Users/Personal/Downloads/cloudflare.pem root@187.33.154.45 \
  '/opt/360_CLUB/deploy/vps-deploy.sh v1.6.1'
```

Secrets de Actions (repo → Settings → Secrets): `VPS_HOST`, `VPS_SSH_KEY`, `VPS_USER`.

### Verificación post-deploy

```bash
# En el VPS
cat /opt/360_CLUB/VERSION
docker compose -f /opt/360_CLUB/deploy/docker-compose.yml ps
docker exec club360-redis redis-cli ping

# Público
curl -s https://app.unogym.online/api/install/status
curl -s https://app.unogym.online/api/health/database
curl -s https://mcp.unogym.online/health
```

### Notas para agentes

- **No crear tags `v*` ni mergear a `main`** salvo que el usuario lo pida explícitamente.
- Tras un tag, comprobar que Actions quedó en verde; si falla, diagnosticar logs y/o redeploy manual con el script.
- `vps-deploy.sh` se **re-ejecuta tras el checkout** (`CLUB360_DEPLOY_PHASE=build`) para usar el script del tag nuevo (evita errores tipo `no such service: mariadb` al cambiar compose).
- No tocar `deploy/.env` del VPS ni rotar `MCP_HTTP_BEARER_TOKEN` sin pedido explícito.

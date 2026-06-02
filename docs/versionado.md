# Versionado y despliegue en VPS

## Tags de Git

Usamos **tags anotados** con prefijo `v` para releases de producción:

```bash
# Crear tag (ejemplo primera release)
git tag -a v1.0.0 -m "Release 1.0.0: redirección login y despliegue automático"
git push origin v1.0.0

# Listar tags
git tag -l 'v*'
```

Convención sugerida: [SemVer](https://semver.org/) — `vMAJOR.MINOR.PATCH`.

| Cambio | Ejemplo |
|--------|---------|
| Fix / parche | `v1.0.0` → `v1.0.1` |
| Feature | `v1.0.1` → `v1.1.0` |
| Breaking | `v1.1.0` → `v2.0.0` |

`main` sigue siendo la rama de desarrollo; **producción en el VPS** se actualiza con **tags**, no con cada commit suelto (salvo deploy manual).

---

## Despliegue automático al publicar un tag

Workflow: [`.github/workflows/deploy-vps.yml`](../.github/workflows/deploy-vps.yml)

Cuando hacés `git push origin v1.0.1`, GitHub Actions se conecta al VPS y ejecuta:

```bash
/opt/360_CLUB/deploy/vps-deploy.sh v1.0.1
```

### Configurar secrets (una sola vez)

En el repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|--------|
| `VPS_HOST` | IP del servidor, ej. `187.33.154.45` |
| `VPS_SSH_KEY` | Clave privada SSH completa (PEM) |
| `VPS_USER` | `root` (opcional) |

### Deploy manual desde GitHub

**Actions → Deploy VPS → Run workflow** → indicar `v1.0.0` o `main`.

---

## Despliegue manual en el VPS (sin Actions)

```bash
ssh root@<IP-VPS>
cd /opt/360_CLUB
git fetch --tags origin
./deploy/vps-deploy.sh v1.0.0
```

El script:

1. Hace `git checkout` del tag o rama
2. Escribe `/opt/360_CLUB/VERSION`
3. Ejecuta `docker compose up -d --build web api`

---

## Comprobar versión desplegada

En el VPS:

```bash
cat /opt/360_CLUB/VERSION
docker compose -f /opt/360_CLUB/deploy/docker-compose.yml ps
```

En la app: https://app.unogym.online

---

## Flujo recomendado

```text
Desarrollo local → commit en main → pruebas
       ↓
git tag -a vX.Y.Z -m "..."
git push origin vX.Y.Z
       ↓
GitHub Actions → VPS (build Docker + reinicio)
```

No hace falta tocar Cloudflare Tunnel ni `deploy/.env` en cada release de solo frontend/backend, salvo que cambien variables de entorno.

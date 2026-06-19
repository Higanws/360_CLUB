#!/usr/bin/env bash
# Despliegue en VPS: checkout de tag o rama y rebuild Docker.
# Uso en el servidor:
#   ./deploy/vps-deploy.sh v1.0.0
#   ./deploy/vps-deploy.sh main
set -euo pipefail

REPO_DIR="${CLUB360_REPO_DIR:-/opt/360_CLUB}"
REF="${1:-main}"
COMPOSE_DIR="${REPO_DIR}/deploy"

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo "No existe repo en ${REPO_DIR}. Cloná primero: git clone https://github.com/Higanws/360_CLUB.git ${REPO_DIR}"
  exit 1
fi

cd "${REPO_DIR}"
git fetch --tags origin
if git rev-parse --verify "origin/${REF}" >/dev/null 2>&1; then
  git checkout -B "${REF}" "origin/${REF}"
elif git rev-parse --verify "${REF}" >/dev/null 2>&1; then
  git checkout "${REF}"
else
  echo "Ref no encontrada: ${REF}"
  exit 1
fi

echo "${REF}" > "${REPO_DIR}/VERSION"
echo "$(git rev-parse --short HEAD)" >> "${REPO_DIR}/VERSION"

cd "${COMPOSE_DIR}"
export VITE_APP_VERSION="${REF}"
docker compose down --remove-orphans 2>/dev/null || true
# Contenedores legacy fuera del proyecto compose actual
for c in club360-mariadb club360-redis club360-api club360-web club360-mcp; do
  docker rm -f "$c" 2>/dev/null || true
done
docker compose up -d --build mariadb redis api web mcp

echo "Desplegado ${REF} ($(head -1 "${REPO_DIR}/VERSION" | tr -d '\n')) en $(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker compose ps

if [[ -x "${COMPOSE_DIR}/setup-cloudflare-mcp.sh" ]]; then
  echo "Cloudflare MCP: ejecutá ${COMPOSE_DIR}/setup-cloudflare-mcp.sh si aún no configuraste mcp.unogym.online"
fi

#!/usr/bin/env bash
# Arranca supercronic (backups) en background y delega a MariaDB.
set -euo pipefail

export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3306}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-${MARIADB_ROOT_PASSWORD:-root}}"
export DB_NAME="${DB_NAME:-${MARIADB_DATABASE:-club360}}"
export BACKUP_DIR="${BACKUP_DIR:-/backups}"
export RETENTION_COUNT="${RETENTION_COUNT:-8}"

mkdir -p "$BACKUP_DIR"

if [ "${BACKUPS_ENABLED:-true}" != "false" ]; then
  echo "[club360-db] Iniciando scheduler de backups (supercronic)…"
  supercronic /scripts/crontab &
else
  echo "[club360-db] Backups deshabilitados (BACKUPS_ENABLED=false)"
fi

# Entrypoint oficial de la imagen MariaDB
exec docker-entrypoint.sh "$@"

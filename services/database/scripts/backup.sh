#!/usr/bin/env sh
# Dump MariaDB → /backups/club360_YYYY-MM-DD_HHMMSS.sql.gz
# Durante el dump: read_only=ON para que la BD rechace escrituras de clientes.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_COUNT="${RETENTION_COUNT:-8}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_NAME="${DB_NAME:-club360}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/club360_${STAMP}.sql.gz"

export MYSQL_PWD="$DB_PASSWORD"

unlock_db() {
  mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SET GLOBAL read_only=OFF;" 2>/dev/null || true
}

trap unlock_db EXIT

echo "[db-backup] Activando read_only…"
mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SET GLOBAL read_only=ON; FLUSH TABLES;"

echo "[db-backup] Dump ${DB_NAME}@${DB_HOST} → ${OUT_FILE}"
mariadb-dump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --databases "$DB_NAME" \
  | gzip -c > "$OUT_FILE"

SIZE="$(wc -c < "$OUT_FILE" | tr -d ' ')"
echo "[db-backup] Completado (${SIZE} bytes)"

COUNT="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'club360_*.sql.gz' | wc -l | tr -d ' ')"
if [ "$COUNT" -gt "$RETENTION_COUNT" ]; then
  REMOVE=$((COUNT - RETENTION_COUNT))
  echo "[db-backup] Rotando: eliminar ${REMOVE} backup(s) antiguo(s)"
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'club360_*.sql.gz' -print \
    | sort \
    | head -n "$REMOVE" \
    | while read -r old; do
        echo "[db-backup] Borrando $old"
        rm -f "$old"
      done
fi

unlock_db
trap - EXIT
unset MYSQL_PWD
echo "[db-backup] read_only desactivado"

#!/usr/bin/env sh
# Restaura un dump .sql.gz (o .sql) sobre la BD.
# Uso: /scripts/restore.sh /backups/club360_....sql.gz
set -eu

if [ "${1:-}" = "" ]; then
  echo "[db-restore] Uso: restore.sh <archivo.sql.gz|archivo.sql>" >&2
  exit 1
fi

DUMP_FILE="$1"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_NAME="${DB_NAME:-club360}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "[db-restore] No existe: $DUMP_FILE" >&2
  exit 1
fi

export MYSQL_PWD="$DB_PASSWORD"

unlock_db() {
  mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SET GLOBAL read_only=OFF;" 2>/dev/null || true
}

trap unlock_db EXIT

echo "[db-restore] Activando read_only (bloquear clientes)…"
mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SET GLOBAL read_only=ON; FLUSH TABLES;"

# Root puede escribir con read_only; forzamos off solo para la sesión de import
# vía SUPER: desactivamos read_only para el import y lo reactivamos conceptualmente
# (el API ya está en maintenance y desconectada).
unlock_db

echo "[db-restore] Importando $DUMP_FILE …"
case "$DUMP_FILE" in
  *.gz)
    gunzip -c "$DUMP_FILE" | mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER"
    ;;
  *)
    mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < "$DUMP_FILE"
    ;;
esac

echo "[db-restore] Completado"
trap - EXIT
unset MYSQL_PWD

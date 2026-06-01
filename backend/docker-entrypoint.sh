#!/bin/sh
set -e

wait_for_mysql() {
  host="${DATABASE_HOST:-mariadb}"
  port="${DATABASE_PORT:-3306}"
  user="${DATABASE_USER:-root}"
  pass="${DATABASE_PASSWORD:-}"
  max="${CLUB360_MYSQL_WAIT_ATTEMPTS:-45}"

  echo "[entrypoint] Esperando MySQL en ${host}:${port}…"
  attempt=1
  while [ "$attempt" -le "$max" ]; do
    if node -e "
      const mysql = require('mysql2/promise');
      (async () => {
        const c = await mysql.createConnection({
          host: process.env.DATABASE_HOST || 'mariadb',
          port: Number(process.env.DATABASE_PORT || 3306),
          user: process.env.DATABASE_USER || 'root',
          password: process.env.DATABASE_PASSWORD || '',
          connectTimeout: 3000,
        });
        await c.query('SELECT 1');
        await c.end();
      })().then(() => process.exit(0)).catch(() => process.exit(1));
    " 2>/dev/null; then
      echo "[entrypoint] MySQL disponible."
      return 0
    fi
    echo "[entrypoint] Intento ${attempt}/${max}…"
    attempt=$((attempt + 1))
    sleep 2
  done
  echo "[entrypoint] MySQL no respondió a tiempo." >&2
  exit 1
}

auto_install_marker() {
  if [ "${CLUB360_AUTO_INSTALL:-0}" != "1" ]; then
    return 0
  fi
  if [ -f /app/data/installed.txt ] || [ -f /app/data/.installed ]; then
    return 0
  fi
  mkdir -p /app/data
  installed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "$installed_at" > /app/data/.installed
  printf 'Club360 — instalación automática (Docker) %s\n' "$installed_at" > /app/data/installed.txt
  echo "[entrypoint] Marcador de instalación creado (modo Docker, sin wizard)."
}

if [ -n "$DATABASE_HOST" ]; then
  wait_for_mysql
fi

auto_install_marker

exec "$@"

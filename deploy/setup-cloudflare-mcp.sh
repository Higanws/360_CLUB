#!/usr/bin/env bash
# Configura Cloudflare Tunnel + DNS para mcp.unogym.online en el VPS.
# Ejecutar en el servidor como root (una vez, o tras cambiar ingress).
set -euo pipefail

TUNNEL_NAME="${CLOUDFLARE_TUNNEL_NAME:-club360-unogym}"
TUNNEL_ID="${CLOUDFLARE_TUNNEL_ID:-53dc6e9c-bb2c-49c6-91c9-0a8e635a6e3d}"
MCP_HOSTNAME="${MCP_HOSTNAME:-mcp.unogym.online}"
APP_HOSTNAME="${APP_HOSTNAME:-app.unogym.online}"
CONFIG_SRC="${1:-/opt/360_CLUB/deploy/cloudflared-config.example.yml}"
CONFIG_DST="/etc/cloudflared/config.yml"
ORIGIN_CERT="${CLOUDFLARE_ORIGIN_CERT:-/etc/cloudflared/cert.pem}"

if [[ ! -f "${CONFIG_SRC}" ]]; then
  echo "No existe ${CONFIG_SRC}"
  exit 1
fi

cp "${CONFIG_SRC}" "${CONFIG_DST}"
chmod 600 "${CONFIG_DST}"

route_dns() {
  local host="$1"
  if [[ -f "${ORIGIN_CERT}" ]]; then
    TUNNEL_ORIGIN_CERT="${ORIGIN_CERT}" cloudflared tunnel route dns "${TUNNEL_ID}" "${host}" 2>/dev/null \
      || TUNNEL_ORIGIN_CERT="${ORIGIN_CERT}" cloudflared tunnel route dns "${TUNNEL_NAME}" "${host}" 2>/dev/null \
      || true
  else
    echo "Aviso: sin ${ORIGIN_CERT}; omitiendo 'cloudflared tunnel route dns'."
    echo "  Creá el CNAME desde una máquina con cert.pem (cloudflared login):"
    echo "    cloudflared tunnel route dns ${TUNNEL_NAME} ${host}"
  fi
}

route_dns "${MCP_HOSTNAME}"
route_dns "${APP_HOSTNAME}"

systemctl enable cloudflared
systemctl restart cloudflared
systemctl status cloudflared --no-pager

echo ""
echo "Túnel actualizado. Probar:"
echo "  curl -s https://${MCP_HOSTNAME}/health"
echo "  curl -s -H \"Authorization: Bearer \$MCP_HTTP_BEARER_TOKEN\" https://${MCP_HOSTNAME}/ ..."

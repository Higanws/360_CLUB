#!/usr/bin/env bash
# Configura Cloudflare Tunnel + DNS para mcp.unogym.online en el VPS.
# Ejecutar en el servidor como root (una vez, o tras cambiar ingress).
set -euo pipefail

TUNNEL_NAME="${CLOUDFLARE_TUNNEL_NAME:-club360-unogym}"
MCP_HOSTNAME="${MCP_HOSTNAME:-mcp.unogym.online}"
APP_HOSTNAME="${APP_HOSTNAME:-app.unogym.online}"
CONFIG_SRC="${1:-/opt/360_CLUB/deploy/cloudflared-config.example.yml}"
CONFIG_DST="/etc/cloudflared/config.yml"

if [[ ! -f "${CONFIG_SRC}" ]]; then
  echo "No existe ${CONFIG_SRC}"
  exit 1
fi

cp "${CONFIG_SRC}" "${CONFIG_DST}"
chmod 600 "${CONFIG_DST}"

cloudflared tunnel route dns "${TUNNEL_NAME}" "${MCP_HOSTNAME}" 2>/dev/null || true
cloudflared tunnel route dns "${TUNNEL_NAME}" "${APP_HOSTNAME}" 2>/dev/null || true

systemctl enable cloudflared
systemctl restart cloudflared
systemctl status cloudflared --no-pager

echo ""
echo "Túnel actualizado. Probar:"
echo "  curl -s https://${MCP_HOSTNAME}/health"
echo "  curl -s -H \"Authorization: Bearer \$MCP_HTTP_BEARER_TOKEN\" https://${MCP_HOSTNAME}/ ..."

# MCP Server Club360

Servidor MCP para agentes externos (Telegram, etc.) en [`mcp-server/`](../mcp-server/).

## URL pública (producción)

| Uso | URL |
|-----|-----|
| **Agente MCP** | `https://mcp.unogym.online` |
| **Health** | `https://mcp.unogym.online/health` |
| **Auth** | Header `Authorization: Bearer <MCP_HTTP_BEARER_TOKEN>` |

La app web sigue en `https://app.unogym.online`. El agente **no** llama a `/api` directamente; usa el MCP.

## Arquitectura VPS

```text
Agente (otro servidor)
  → https://mcp.unogym.online (Cloudflare)
  → cloudflared → 127.0.0.1:3100 (Docker club360-mcp)
  → http://api:3000/api (red Docker interna)
```

## Despliegue (Docker Compose)

Variables en [`deploy/.env`](../deploy/.env):

```env
MCP_CLUB360_USERNAME=admin
MCP_CLUB360_PASSWORD=...
MCP_HTTP_BEARER_TOKEN=...   # openssl rand -hex 32
MCP_PUBLIC_URL=https://mcp.unogym.online
```

```bash
cd /opt/360_CLUB/deploy
docker compose up -d --build mcp
curl http://127.0.0.1:3100/health
```

Incluido en [`vps-deploy.sh`](../deploy/vps-deploy.sh) (`docker compose up ... mcp`).

## Cloudflare Tunnel

1. Plantilla: [`deploy/cloudflared-config.example.yml`](../deploy/cloudflared-config.example.yml)
2. En el VPS:

```bash
chmod +x /opt/360_CLUB/deploy/setup-cloudflare-mcp.sh
/opt/360_CLUB/deploy/setup-cloudflare-mcp.sh
```

3. Verificar:

```bash
curl -s https://mcp.unogym.online/health
curl -s -H "Authorization: Bearer TU_TOKEN" https://mcp.unogym.online/
```

## Agente remoto (ejemplo)

```typescript
const transport = new StreamableHTTPClientTransport(
  new URL('https://mcp.unogym.online'),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.MCP_HTTP_BEARER_TOKEN}`,
      },
    },
  },
);
```

## Telegram y WhatsApp (webhooks)

El MCP **no** recibe webhooks de Telegram ni WhatsApp. Necesitás un **servicio bot** aparte que:

1. Exponga HTTPS (`https://bot.tudominio.com/...`) para el webhook de la plataforma.
2. Use un cliente MCP HTTP contra `https://mcp.unogym.online` con el Bearer token.
3. Orqueste un LLM con tool calling (o comandos fijos) y responda al usuario.

Guía completa: **[mcp-webhooks-telegram-whatsapp.md](./mcp-webhooks-telegram-whatsapp.md)** (Telegram `setWebhook`, WhatsApp Cloud API, variables, seguridad y ejemplos de código).

## Desarrollo local

Ver [`mcp-server/README.md`](../mcp-server/README.md) (stdio / HTTP local).

## Rama de trabajo

```bash
git checkout -b feature/mcp-server
```

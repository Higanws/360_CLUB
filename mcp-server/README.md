# Club360 MCP Server

Servidor [Model Context Protocol](https://modelcontextprotocol.io) autocontenido sobre la REST API de Club360. Pensado para agentes (Cursor, bot Telegram en otro proyecto) con **prompt mínimo**: el MCP expone resources de guía y tools semánticas.

## Requisitos

- Node.js 20+
- Club360 API accesible (local o producción)
- Usuario `administrator` o `staff_member` en `.env`

## Configuración

```bash
cd mcp-server
cp .env.example .env
# Editar CLUB360_API_URL, CLUB360_USERNAME, CLUB360_PASSWORD
npm install
npm run build
```

## Producción (VPS + Cloudflare)

URL del agente: **https://mcp.unogym.online**

Header obligatorio (salvo `/health`):

```http
Authorization: Bearer <MCP_HTTP_BEARER_TOKEN>
```

Ver [docs/mcp-server.md](../docs/mcp-server.md) y `deploy/setup-cloudflare-mcp.sh`.

### Bot Telegram / WhatsApp

El MCP no es el webhook de mensajería. Creá un servicio bot que llame al MCP por HTTP. Guía: [docs/mcp-webhooks-telegram-whatsapp.md](../docs/mcp-webhooks-telegram-whatsapp.md).

## Desarrollo local

### stdio (Cursor / agentes locales)

```bash
npm start
# o desarrollo:
npm run dev
```

En Cursor: **Settings → MCP** → añadir servidor:

```json
{
  "mcpServers": {
    "club360": {
      "command": "node",
      "args": ["/ruta/absoluta/360_CLUB/mcp-server/dist/index.js"],
      "env": {
        "CLUB360_API_URL": "https://app.unogym.online/api",
        "CLUB360_USERNAME": "admin",
        "CLUB360_PASSWORD": "tu-password"
      }
    }
  }
}
```

### HTTP (bot Telegram u otro host)

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3100 npm start
```

Conectá el cliente MCP a `http://127.0.0.1:3100`. Health: `GET /health`.

## Prompt mínimo para el agente

> Sos operador de Club360. Usá las tools MCP para cumplir lo que pida el usuario. Si dudás de términos o pasos, leé los resources `club360://guide/*` antes de actuar. Confirmá acciones destructivas o cobros.

## Resources (descubrimiento)

| URI | Contenido |
|-----|-----------|
| `club360://guide/domain` | Glosario y roles |
| `club360://guide/workflows` | Flujos: crear socio, cambiar comida, cobros |
| `club360://guide/nutrition-model` | Modelo de comidas |
| `club360://guide/permissions` | Permisos por rol |
| `club360://guide/errors` | Errores API |

## Tools principales (Fase 1)

- `club360_session_status`, `club360_list_capabilities`
- `member_find`, `member_create`, `member_update`, …
- `nutrition_meal_update` — cambia un plato sin enviar el plan completo

Ver `club360_list_capabilities` para el catálogo según tu rol.

## Modo migración (lotes)

Para importar datos legacy (clientes, rutinas, nutrición, etc.):

1. Leé el resource `club360://guide/migration`
2. `migration_plan` — orden de fases
3. `migration_requirements` — campos obligatorios por entidad/tabla
4. `migration_validate_batch` — dry run
5. `migration_import_batch` — carga real (máx. 200 ítems; acumular `id_map`)

Rol: **administrator**.

## Tests

```bash
npm test
```

## Despliegue en VPS

Ver [docs/mcp-server.md](../docs/mcp-server.md).

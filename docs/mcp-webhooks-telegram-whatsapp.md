# Integrar MCP Club360 con Telegram y WhatsApp

Guía para conectar un **bot de mensajería** (Telegram o WhatsApp) al servidor MCP en producción:

| Recurso | URL |
|---------|-----|
| **MCP (agente)** | `https://mcp.unogym.online` |
| **Health (público)** | `https://mcp.unogym.online/health` |
| **Auth MCP** | `Authorization: Bearer <MCP_HTTP_BEARER_TOKEN>` |

El token Bearer está en el VPS (`deploy/.env` → `MCP_HTTP_BEARER_TOKEN`, copia en `/root/club360-mcp-token.txt`). **No lo publiques ni lo envíes al chat del bot.**

---

## Idea clave: dos URLs distintas

`https://mcp.unogym.online` **no** es el webhook de Telegram ni de WhatsApp.

```text
Usuario (Telegram / WhatsApp)
        │
        ▼
┌───────────────────────────────┐
│  TU servicio bot (webhook)    │  ← URL pública del bot, ej. https://bot.tudominio.com
│  - recibe mensajes            │
│  - valida firma / secret      │
│  - llama al LLM + MCP         │
│  - responde al usuario        │
└───────────────┬───────────────┘
                │  MCP Streamable HTTP + Bearer
                ▼
┌───────────────────────────────┐
│  https://mcp.unogym.online    │  ← ya desplegado en el VPS
│  (Club360 MCP)                │
└───────────────┬───────────────┘
                │  REST interna
                ▼
         Club360 API (socios, nutrición, cobros…)
```

El MCP expone **tools semánticas** (`member_find`, `nutrition_meal_update`, etc.) y **resources** de guía (`club360://guide/*`). Tu bot solo necesita un cliente MCP y un modelo que pueda usar esas tools.

---

## Requisitos del proyecto bot

- Node.js 20+ (recomendado) u otro runtime con cliente MCP HTTP.
- Servidor HTTPS accesible desde internet (Telegram y Meta exigen HTTPS en webhooks).
- Variables de entorno (ver [Variables](#variables-de-entorno)).
- Cliente MCP: `@modelcontextprotocol/sdk` (`StreamableHTTPClientTransport`).
- Proveedor LLM con soporte de **tool calling** (OpenAI, Anthropic, etc.) **o** un router propio que invoque tools MCP según intents.

---

## Cliente MCP (HTTP remoto)

Ejemplo mínimo de conexión al MCP de producción:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = process.env.MCP_URL ?? 'https://mcp.unogym.online';
const MCP_TOKEN = process.env.MCP_HTTP_BEARER_TOKEN!;

export async function createMcpClient() {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${MCP_TOKEN}`,
      },
    },
  });

  const client = new Client(
    { name: 'club360-telegram-bot', version: '1.0.0' },
    { capabilities: {} },
  );

  await client.connect(transport);
  return client;
}
```

Comprobación rápida:

```bash
curl -s https://mcp.unogym.online/health
# → {"ok":true,"service":"club360-mcp",...}
```

Tras conectar, el agente puede:

```typescript
const { tools } = await client.listTools();
const result = await client.callTool({
  name: 'member_find',
  arguments: { query: 'Ana', limit: 5 },
});
```

**Sesiones:** el transporte Streamable HTTP del SDK gestiona la sesión MCP. Reutilizá un `Client` por proceso o por conversación (map `chatId → Client`) según volumen; cerrá con `client.close()` al apagar.

---

## Prompt del agente (mínimo)

Usá este system prompt en el LLM que orquesta el MCP:

```text
Sos operador de Club360 para el personal del gimnasio.
Usá las tools MCP para cumplir lo que pida el usuario por chat.
Si dudás de términos o pasos, leé los resources club360://guide/* antes de actuar.
Confirmá acciones destructivas (borrar socio, cobros) antes de ejecutarlas.
Respondé en español, claro y breve, apto para Telegram/WhatsApp (sin tablas enormes).
```

Resources útiles: `club360://guide/workflows`, `club360://guide/nutrition-model`, `club360://guide/permissions`.

---

## Telegram — webhook

### 1. Crear el bot

1. Hablar con [@BotFather](https://t.me/BotFather) → `/newbot`.
2. Guardar `TELEGRAM_BOT_TOKEN`.

### 2. Desplegar tu servicio webhook

Ejemplo con Express (ruta **del bot**, no del MCP):

```typescript
import express from 'express';
import { createMcpClient } from './mcp-client.js';
import { runAgentTurn } from './agent.js'; // LLM + tools MCP

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;
const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.post('/telegram/webhook', async (req, res) => {
  // Telegram envía el header X-Telegram-Bot-Api-Secret-Token si configuraste secret_token
  if (req.header('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }

  const update = req.body;
  const message = update.message ?? update.edited_message;
  if (!message?.text) {
    return res.sendStatus(200);
  }

  const chatId = String(message.chat.id);
  if (ALLOWED_CHAT_IDS.length && !ALLOWED_CHAT_IDS.includes(chatId)) {
    await sendTelegram(chatId, 'No autorizado.');
    return res.sendStatus(200);
  }

  res.sendStatus(200); // responder rápido a Telegram

  try {
    const mcp = await createMcpClient();
    const reply = await runAgentTurn(message.text, mcp);
    await sendTelegram(chatId, reply);
    await mcp.close();
  } catch (err) {
    console.error(err);
    await sendTelegram(chatId, 'Error procesando la solicitud.');
  }
});

async function sendTelegram(chatId: string, text: string) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );
}

app.listen(process.env.PORT ?? 3001);
```

### 3. Registrar el webhook en Telegram

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://bot.tudominio.com/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "edited_message"]
  }'
```

Verificar:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

### 4. Telegram — notas

| Tema | Detalle |
|------|---------|
| **HTTPS** | Obligatorio; certificado válido (Let's Encrypt, Cloudflare, etc.). |
| **Timeout** | Telegram espera respuesta HTTP en ~60 s; respondé `200` pronto y procesá en background si el LLM tarda. |
| **Long polling** | Alternativa sin webhook: `getUpdates` en un worker; el patrón MCP es el mismo. |
| **Seguridad** | Usá `secret_token` + lista blanca de `chat_id` del staff. |

---

## WhatsApp — webhook (Cloud API)

Meta envía eventos a **tu** URL; el flujo con MCP es idéntico al de Telegram (recibir texto → agente → MCP → responder).

### 1. Meta Developer

1. [developers.facebook.com](https://developers.facebook.com) → App → **WhatsApp** → **API Setup**.
2. Anotar `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` (el que elijas para verificación).

### 2. Verificación GET + mensajes POST

```typescript
app.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/whatsapp/webhook', async (req, res) => {
  res.sendStatus(200);

  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const msg = change?.value?.messages?.[0];
  if (!msg || msg.type !== 'text') return;

  const from = msg.from; // número E.164 sin +
  const text = msg.text.body;

  const allowed = (process.env.WHATSAPP_ALLOWED_NUMBERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(from)) return;

  try {
    const mcp = await createMcpClient();
    const reply = await runAgentTurn(text, mcp);
    await sendWhatsApp(from, reply);
    await mcp.close();
  } catch (err) {
    console.error(err);
    await sendWhatsApp(from, 'Error procesando la solicitud.');
  }
});

async function sendWhatsApp(to: string, text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}
```

### 3. Configurar webhook en Meta

En **WhatsApp → Configuration → Webhook**:

| Campo | Valor |
|-------|--------|
| **Callback URL** | `https://bot.tudominio.com/whatsapp/webhook` |
| **Verify token** | mismo que `WHATSAPP_VERIFY_TOKEN` |
| **Campos** | suscribir `messages` |

### 4. WhatsApp — notas

| Tema | Detalle |
|------|---------|
| **Ventana 24 h** | Respuestas libres solo dentro de 24 h desde el último mensaje del usuario; fuera, plantillas aprobadas. |
| **Rate limits** | Meta aplica límites por número; evitá loops agente ↔ usuario. |
| **Mismo MCP** | Un solo `MCP_HTTP_BEARER_TOKEN`; podés unificar Telegram y WA en un solo servicio con dos rutas. |

---

## Bucle agente (LLM + MCP)

Pseudocódigo del turno de conversación:

```typescript
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

export async function runAgentTurn(userText: string, mcp: Client): Promise<string> {
  const { tools } = await mcp.listTools();

  // Adaptar tools MCP al formato de tu proveedor LLM (OpenAI, Anthropic…)
  const llmTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.inputSchema,
  }));

  let messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userText },
  ];

  for (let step = 0; step < 8; step++) {
    const response = await callLlm({ messages, tools: llmTools });

    if (response.toolCalls?.length) {
      for (const call of response.toolCalls) {
        const out = await mcp.callTool({
          name: call.name,
          arguments: call.arguments,
        });
        messages.push(
          { role: 'assistant', tool_calls: [call] },
          { role: 'tool', name: call.name, content: JSON.stringify(out.content) },
        );
      }
      continue;
    }

    return response.text ?? 'Listo.';
  }

  return 'Necesito más datos o la operación es demasiado larga.';
}
```

Podés empezar **sin LLM** enrutando comandos fijos (`/socio Ana` → `member_find`) y migrar después a tool calling completo.

---

## Variables de entorno

Archivo `.env` del **proyecto bot** (no commitear):

```env
# MCP Club360 (producción)
MCP_URL=https://mcp.unogym.online
MCP_HTTP_BEARER_TOKEN=...

# LLM (ejemplo OpenAI)
OPENAI_API_KEY=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...          # openssl rand -hex 16
TELEGRAM_ALLOWED_CHAT_IDS=123456789  # opcional, IDs del staff

# WhatsApp Cloud API
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_ALLOWED_NUMBERS=54911...    # opcional

PORT=3001
```

El MCP en el VPS usa credenciales **distintas** (`MCP_CLUB360_USERNAME` / `MCP_CLUB360_PASSWORD`) para hablar con la API Club360; el bot **solo** necesita el Bearer del MCP.

---

## Seguridad

1. **Bearer MCP** solo en el servidor del bot; nunca en el cliente móvil ni en el chat.
2. **Allowlist** de `chat_id` (Telegram) o números (WhatsApp) del personal autorizado.
3. **Webhook secrets** (`secret_token`, `WHATSAPP_VERIFY_TOKEN`) y validación de firma Meta cuando actives `app secret`.
4. **HTTPS** en la URL del bot; Cloudflare Tunnel sirve igual que para `app.unogym.online`.
5. **Logs** sin passwords ni tokens; el MCP ya filtra tools por rol (`administrator` vs `staff_member`).
6. **Confirmación** en chat para borrados y cobros (lo puede exigir el prompt del agente).

---

## Despliegue sugerido del bot

| Opción | Comentario |
|--------|------------|
| **Mismo VPS** (`187.33.154.45`) | Otro contenedor en `deploy/` o PM2 en puerto interno + regla Cloudflare `bot.unogym.online` → `:3001`. |
| **PaaS** (Railway, Fly.io, Render) | Webhook HTTPS incluido; MCP sigue en `mcp.unogym.online`. |
| **Local + túnel** | Solo pruebas; `ngrok` / `cloudflared` hacia tu bot local. |

No hace falta tocar el contenedor `club360-mcp` para añadir Telegram/WA: solo consumís el MCP por HTTP.

---

## Checklist

- [ ] `curl https://mcp.unogym.online/health` → `ok: true`
- [ ] Cliente MCP con Bearer conecta y `listTools` devuelve tools
- [ ] Bot HTTPS desplegado en URL propia
- [ ] Webhook Telegram o WhatsApp apunta al bot (no al MCP)
- [ ] Allowlist de usuarios staff configurada
- [ ] Prueba: «buscar socio Ana» → `member_find` → respuesta en chat

---

## Referencias en este repo

- [mcp-server.md](./mcp-server.md) — despliegue MCP y Cloudflare
- [mcp-server/README.md](../mcp-server/README.md) — tools, resources, tests locales
- [mcp-server/src/agent-mcp-test.ts](../mcp-server/src/agent-mcp-test.ts) — ejemplo de cliente MCP (stdio; en producción usar HTTP)

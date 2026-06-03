import type { IncomingMessage, ServerResponse } from 'node:http';

export function checkBearerAuth(
  req: IncomingMessage,
  res: ServerResponse,
  expectedToken: string | null,
): boolean {
  if (!expectedToken) return true;

  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || match[1] !== expectedToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Unauthorized',
        message:
          'Falta o es inválido Authorization: Bearer. Configurá MCP_HTTP_BEARER_TOKEN en el agente.',
      }),
    );
    return false;
  }
  return true;
}

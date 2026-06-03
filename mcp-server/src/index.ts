#!/usr/bin/env node
import { createServer as createHttpServer } from 'node:http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config.js';
import { Club360Client } from './client/club360-client.js';
import { createClub360McpServer } from './server.js';
import { checkBearerAuth } from './http-auth.js';

async function main() {
  const config = loadConfig();
  const client = new Club360Client(config);
  await client.ensureAuthenticated();

  const mcp = await createClub360McpServer(client);

  if (config.transport === 'http') {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await mcp.connect(transport);

    const httpServer = createHttpServer(async (req, res) => {
      const path = req.url?.split('?')[0] ?? req.url;
      if (path === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            service: 'club360-mcp',
            publicUrl: config.publicUrl,
            authRequired: Boolean(config.httpBearerToken),
          }),
        );
        return;
      }
      if (!checkBearerAuth(req, res, config.httpBearerToken)) {
        return;
      }
      await transport.handleRequest(req, res);
    });

    httpServer.listen(config.httpPort, config.httpHost, () => {
      console.error(
        `Club360 MCP HTTP en http://${config.httpHost}:${config.httpPort}`,
      );
    });
  } else {
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
    console.error('Club360 MCP stdio listo');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

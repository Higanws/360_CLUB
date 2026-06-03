import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Club360Client } from './client/club360-client.js';
import { loadGuideResources } from './resources/load-resources.js';
import { invokeTool, listToolsForSession } from './tools/registry.js';

export async function createClub360McpServer(
  client: Club360Client,
): Promise<McpServer> {
  const server = new McpServer({
    name: 'club360',
    version: '1.0.0',
  });

  for (const g of loadGuideResources()) {
    server.registerResource(
      g.name,
      g.uri,
      { description: g.description, mimeType: g.mimeType },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: g.mimeType,
            text: g.text,
          },
        ],
      }),
    );
  }

  await registerTools(server, client);

  return server;
}

async function registerTools(server: McpServer, client: Club360Client) {
  await client.ensureAuthenticated();
  const tools = await listToolsForSession(client);

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: Record<string, unknown>) => {
        const text = await invokeTool(client, tool.name, args);
        return {
          content: [{ type: 'text' as const, text }],
        };
      },
    );
  }
}

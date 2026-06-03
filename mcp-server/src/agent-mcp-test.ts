/**
 * Prueba como agente real: cliente MCP por stdio (igual que Cursor).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../.env') });

async function main() {
  const entry = resolve(__dirname, '../dist/index.js');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [entry],
    env: {
      CLUB360_API_URL: process.env.CLUB360_API_URL ?? 'http://localhost:3000/api',
      CLUB360_USERNAME: process.env.CLUB360_USERNAME ?? 'staff',
      CLUB360_PASSWORD: process.env.CLUB360_PASSWORD ?? 'staff',
      MCP_TRANSPORT: 'stdio',
    },
  });

  const client = new Client(
    { name: 'club360-agent-test', version: '1.0.0' },
    { capabilities: {} },
  );

  await client.connect(transport);
  console.log('✓ MCP connect (stdio)');

  const { tools } = await client.listTools();
  console.log(`✓ listTools → ${tools.length} tools`);
  const names = tools.map((t) => t.name);
  if (!names.includes('member_find')) {
    throw new Error('Falta member_find en listTools');
  }

  const resources = await client.listResources();
  console.log(`✓ listResources → ${resources.resources.length} resources`);
  const guide = resources.resources.find((r) => r.uri.includes('workflows'));
  if (guide) {
    const read = await client.readResource({ uri: guide.uri });
    const first = read.contents[0];
    const text = first && 'text' in first ? first.text : '';
    console.log(
      `✓ readResource workflows (${text.length} chars, contiene "crear socio": ${text.includes('crear socio')})`,
    );
  }

  const findResult = await client.callTool({
    name: 'member_find',
    arguments: { query: 'Ana', limit: 3 },
  });
  const findContent = findResult.content as Array<{ type: string; text?: string }>;
  const findText = findContent?.[0]?.text ?? JSON.stringify(findResult);
  console.log(
    `✓ callTool member_find → ${findText.includes('"ok": true') ? 'OK' : findText.slice(0, 200)}`,
  );

  const statusResult = await client.callTool({
    name: 'club360_session_status',
    arguments: {},
  });
  const statusContent = statusResult.content as Array<{ type: string; text?: string }>;
  const statusText = statusContent?.[0]?.text ?? '';
  console.log(
    `✓ callTool club360_session_status → ${statusText.includes('staff_member') ? 'staff_member' : statusText.slice(0, 120)}`,
  );

  await client.close();
  console.log('\nAgente MCP: protocolo completo OK');
}

main().catch((e) => {
  console.error('FALLÓ agente MCP:', e);
  process.exit(1);
});

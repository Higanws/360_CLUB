import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(__dirname, '../.env') });

export type McpConfig = {
  apiUrl: string;
  username: string;
  password: string;
  requestTimeoutMs: number;
  transport: 'stdio' | 'http';
  httpHost: string;
  httpPort: number;
  /** Si está definido, exige Authorization: Bearer en modo HTTP (excepto /health). */
  httpBearerToken: string | null;
  publicUrl: string | null;
};

export function loadConfig(): McpConfig {
  const apiUrl = (process.env.CLUB360_API_URL ?? 'http://localhost:3000/api').replace(
    /\/$/,
    '',
  );
  const username = process.env.CLUB360_USERNAME ?? '';
  const password = process.env.CLUB360_PASSWORD ?? '';
  if (!username || !password) {
    throw new Error(
      'Faltan CLUB360_USERNAME y CLUB360_PASSWORD en el entorno (.env)',
    );
  }
  const transport =
    (process.env.MCP_TRANSPORT ?? 'stdio').toLowerCase() === 'http'
      ? 'http'
      : 'stdio';
  return {
    apiUrl,
    username,
    password,
    requestTimeoutMs: Number(process.env.CLUB360_REQUEST_TIMEOUT_MS ?? 30000),
    transport,
    httpHost: process.env.MCP_HTTP_HOST ?? '127.0.0.1',
    httpPort: Number(process.env.MCP_HTTP_PORT ?? 3100),
    httpBearerToken: process.env.MCP_HTTP_BEARER_TOKEN?.trim() || null,
    publicUrl: process.env.MCP_PUBLIC_URL?.trim() || null,
  };
}

import { z } from 'zod';
import { permissionsSummary } from '../auth/session.js';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';

export const sessionTools: ToolDefinition[] = [
  {
    name: 'club360_session_status',
    description: `Estado de sesión Club360 (usuario, rol, permisos).
Frases: "¿quién soy?", "¿qué permisos tengo?"
Rol requerido: business (admin o staff).
Ejemplo output: { username, role_name, permissions_summary }`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      const user = await client.getMe();
      return formatToolSuccess({
        username: user.username,
        role_name: user.role_name,
        permissions_summary: permissionsSummary(user.role_name),
        guide: 'club360://guide/permissions',
      });
    },
  },
  {
    name: 'club360_list_capabilities',
    description: `Lista tools MCP disponibles para tu rol actual, con hints REST y resources.
Frases: "¿qué puedo hacer?", "¿qué herramientas hay?"
Usar cuando dudes qué tool invocar.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      const user = await client.getMe();
      return formatToolSuccess({
        role: user.role_name,
        tools: [],
        note: 'Usá club360_list_capabilities tras iniciar el servidor MCP.',
      });
    },
  },
];

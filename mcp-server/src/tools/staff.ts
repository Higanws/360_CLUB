import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import { findStaff } from '../orchestration/member-resolver.js';
import type { ToolDefinition } from './types.js';

export const staffTools: ToolDefinition[] = [
  {
    name: 'staff_find',
    description: `Busca personal por nombre o username. Rol: business.`,
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().int().min(1).max(50).optional().default(20),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { query, limit } = args as { query: string; limit?: number };
      const staff = await findStaff(client, query, limit ?? 20);
      return formatToolSuccess({ query, count: staff.length, staff });
    },
  },
  {
    name: 'staff_get',
    description: `Detalle de staff por id. Rol: business.`,
    inputSchema: z.object({ staff_id: z.number().int().positive() }),
    minRole: 'business',
    async handler(client, args) {
      const { staff_id } = args as { staff_id: number };
      return formatToolSuccess(await client.request(`/staff/${staff_id}`));
    },
  },
  {
    name: 'staff_create',
    description: `Alta de personal. Rol: administrator.`,
    inputSchema: z.object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      username: z.string().min(3),
      password: z.string().min(6),
      gender: z.enum(['male', 'female', 'other']),
      di_dni_type: z.enum(['DI', 'DNI']),
      di_dni_number: z.string().min(1),
      email: z.string().email().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/staff', { method: 'POST', body: args }),
      );
    },
  },
  {
    name: 'staff_update',
    description: `Actualiza staff. Rol: administrator.`,
    inputSchema: z.object({
      staff_id: z.number().int().positive(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { staff_id, ...body } = args as { staff_id: number } & Record<
        string,
        unknown
      >;
      return formatToolSuccess(
        await client.request(`/staff/${staff_id}`, { method: 'PATCH', body }),
      );
    },
  },
  {
    name: 'staff_delete',
    description: `Elimina staff. confirm: true obligatorio. Rol: administrator.`,
    inputSchema: z.object({
      staff_id: z.number().int().positive(),
      confirm: z.literal(true),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { staff_id } = args as { staff_id: number };
      return formatToolSuccess(
        await client.request(`/staff/${staff_id}`, { method: 'DELETE' }),
      );
    },
  },
];

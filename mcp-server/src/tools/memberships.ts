import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';

export const membershipTools: ToolDefinition[] = [
  {
    name: 'membership_list',
    description: `Lista planes de membresía. Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler(client) {
      return formatToolSuccess(await client.request('/memberships'));
    },
  },
  {
    name: 'membership_get',
    description: `Detalle de plan de membresía. Rol: administrator.`,
    inputSchema: z.object({ membership_id: z.number().int().positive() }),
    minRole: 'administrator',
    async handler(client, args) {
      const { membership_id } = args as { membership_id: number };
      return formatToolSuccess(
        await client.request(`/memberships/${membership_id}`),
      );
    },
  },
  {
    name: 'membership_create',
    description: `Crea plan de membresía. Rol: administrator.`,
    inputSchema: z.object({
      membership_label: z.string(),
      membership_amount: z.number(),
      membership_period_days: z.number().int(),
      signup_fee: z.number().optional(),
      installment_plan: z.string().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/memberships', { method: 'POST', body: args }),
      );
    },
  },
  {
    name: 'membership_update',
    description: `Actualiza plan de membresía. Rol: administrator.`,
    inputSchema: z.object({
      membership_id: z.number().int().positive(),
      membership_label: z.string().optional(),
      membership_amount: z.number().optional(),
      membership_period_days: z.number().int().optional(),
      signup_fee: z.number().optional(),
      installment_plan: z.string().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { membership_id, ...body } = args as {
        membership_id: number;
      } & Record<string, unknown>;
      return formatToolSuccess(
        await client.request(`/memberships/${membership_id}`, {
          method: 'PATCH',
          body,
        }),
      );
    },
  },
];

import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';

export const paymentTools: ToolDefinition[] = [
  {
    name: 'payment_expiring_list',
    description: `Cuotas de membresía que vencen este mes. Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler(client) {
      return formatToolSuccess(
        await client.request('/payments/membership/expiring-this-month'),
      );
    },
  },
  {
    name: 'payment_manual_register',
    description: `Registra cobro manual de membresía.
Frases: "cobrar membresía a Juan", "registrar pago plan básico".
Rol: administrator.`,
    inputSchema: z.object({
      member_id: z.number().int().positive(),
      membership_id: z.number().int().positive(),
      paid_amount: z.number().min(0),
      start_date: z.string().describe('YYYY-MM-DD'),
      end_date: z.string().describe('YYYY-MM-DD'),
      membership_amount: z.number().min(0).optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/payments/membership/manual', {
          method: 'POST',
          body: args,
        }),
      );
    },
  },
  {
    name: 'payment_mark_paid',
    description: `Marca cuota como pagada por mpId. Rol: administrator.`,
    inputSchema: z.object({ mp_id: z.number().int().positive() }),
    minRole: 'administrator',
    async handler(client, args) {
      const { mp_id } = args as { mp_id: number };
      return formatToolSuccess(
        await client.request(`/payments/membership/${mp_id}/paid`, {
          method: 'PATCH',
        }),
      );
    },
  },
];

export const dashboardTools: ToolDefinition[] = [
  {
    name: 'dashboard_business_metrics',
    description: `Métricas de negocio (ventas, accesos). Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler(client) {
      return formatToolSuccess(
        await client.request('/dashboard/business-metrics'),
      );
    },
  },
];

export const settingsTools: ToolDefinition[] = [
  {
    name: 'settings_branding_get',
    description: `Branding público del club (nombre, logo, colores). Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      return formatToolSuccess(await client.request('/settings/branding'));
    },
  },
];

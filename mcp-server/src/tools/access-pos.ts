import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';

export const accessTools: ToolDefinition[] = [
  {
    name: 'access_check',
    description: `Valida acceso por QR/tarjeta (lookup). Rol: administrator.`,
    inputSchema: z.object({
      lookup: z.string().describe('Código QR, tarjeta o identificador'),
      record: z.boolean().optional().default(true),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/access-control/check', {
          method: 'POST',
          body: args,
        }),
      );
    },
  },
  {
    name: 'access_recent_logs',
    description: `Logs recientes de acceso. Rol: administrator.`,
    inputSchema: z.object({
      limit: z.number().int().min(1).max(500).optional().default(100),
      from: z.string().optional(),
      to: z.string().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const a = args as { limit?: number; from?: string; to?: string };
      return formatToolSuccess(
        await client.request('/access-control/recent', {
          query: { limit: a.limit, from: a.from, to: a.to },
        }),
      );
    },
  },
];

export const posTools: ToolDefinition[] = [
  {
    name: 'pos_catalog',
    description: `Catálogo POS. Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler(client) {
      return formatToolSuccess(await client.request('/pos/catalog'));
    },
  },
  {
    name: 'pos_product_list',
    description: `Stock de productos POS. Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler(client) {
      return formatToolSuccess(await client.request('/pos/products'));
    },
  },
  {
    name: 'pos_product_create',
    description: `Crea producto POS. Rol: administrator.`,
    inputSchema: z.object({
      name: z.string(),
      unit_price: z.number().min(0),
      sku: z.string().optional(),
      stock_qty: z.number().int().min(0).optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/pos/products', { method: 'POST', body: args }),
      );
    },
  },
  {
    name: 'pos_product_update',
    description: `Actualiza producto POS. Rol: administrator.`,
    inputSchema: z.object({
      product_id: z.number().int().positive(),
      name: z.string().optional(),
      unit_price: z.number().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { product_id, ...body } = args as {
        product_id: number;
      } & Record<string, unknown>;
      return formatToolSuccess(
        await client.request(`/pos/products/${product_id}`, {
          method: 'PATCH',
          body,
        }),
      );
    },
  },
  {
    name: 'pos_product_stock_update',
    description: `Ajusta stock de producto. Rol: administrator.`,
    inputSchema: z.object({
      product_id: z.number().int().positive(),
      stock_qty: z.number().int(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { product_id, stock_qty } = args as {
        product_id: number;
        stock_qty: number;
      };
      return formatToolSuccess(
        await client.request(`/pos/products/${product_id}/stock`, {
          method: 'PATCH',
          body: { stock_qty },
        }),
      );
    },
  },
  {
    name: 'pos_product_delete',
    description: `Elimina producto POS. confirm: true. Rol: administrator.`,
    inputSchema: z.object({
      product_id: z.number().int().positive(),
      confirm: z.literal(true),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { product_id } = args as { product_id: number };
      return formatToolSuccess(
        await client.request(`/pos/products/${product_id}`, {
          method: 'DELETE',
        }),
      );
    },
  },
  {
    name: 'pos_sale_create',
    description: `Registra venta POS. Rol: administrator.`,
    inputSchema: z.object({
      payment_method: z.string(),
      lines: z
        .array(
          z.object({
            product_id: z.number().int().positive(),
            qty: z.number().int().positive(),
          }),
        )
        .min(1),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/pos/sales', { method: 'POST', body: args }),
      );
    },
  },
  {
    name: 'pos_sales_list',
    description: `Lista ventas POS por rango de fechas. Rol: administrator.`,
    inputSchema: z.object({
      from: z.string().describe('YYYY-MM-DD'),
      to: z.string().describe('YYYY-MM-DD'),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { from, to } = args as { from: string; to: string };
      return formatToolSuccess(
        await client.request('/pos/sales', { query: { from, to } }),
      );
    },
  },
];

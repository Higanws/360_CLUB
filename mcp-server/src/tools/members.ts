import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import { findMembers } from '../orchestration/member-resolver.js';
import type { ToolDefinition } from './types.js';

const genderSchema = z.enum(['male', 'female', 'other']);
const dniTypeSchema = z.enum(['DI', 'DNI']);

export const memberTools: ToolDefinition[] = [
  {
    name: 'member_find',
    description: `Busca socios/clientes por nombre, apellido, username o DNI.
Frases: "buscá a Juan", "encontrá cliente Pérez".
Prerequisito antes de nutrition_* o member_update cuando solo tenés un nombre.
Rol: business.`,
    inputSchema: z.object({
      query: z.string().describe('Texto a buscar (nombre, DNI, username)'),
      limit: z.number().int().min(1).max(50).optional().default(20),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { query, limit } = args as { query: string; limit?: number };
      const members = await findMembers(client, query, limit ?? 20);
      return formatToolSuccess({ query, count: members.length, members });
    },
  },
  {
    name: 'member_get',
    description: `Detalle de un socio por id numérico.
Frases: "ficha del socio 5", "datos del cliente id 12".
Rol: business.`,
    inputSchema: z.object({
      member_id: z.number().int().positive(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { member_id } = args as { member_id: number };
      const data = await client.request(`/members/${member_id}`);
      return formatToolSuccess(data);
    },
  },
  {
    name: 'member_create',
    description: `Alta de socio/cliente nuevo.
Frases: "creá un cliente", "dar de alta socio Juan Pérez".
Campos mínimos: first_name, last_name, username, password, gender, di_dni_type, di_dni_number.
Rol: administrator.`,
    inputSchema: z.object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      username: z.string().min(3),
      password: z.string().min(6),
      gender: genderSchema,
      di_dni_type: dniTypeSchema,
      di_dni_number: z.string().min(1),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      selected_membership: z.string().optional().describe('ID plan membresía'),
      assign_staff_mem: z.number().int().optional(),
      membership_valid_from: z.string().optional(),
      membership_valid_to: z.string().optional(),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const body = args as Record<string, unknown>;
      await client.request('/members/form-options');
      const data = await client.request('/members', {
        method: 'POST',
        body,
      });
      return formatToolSuccess(data);
    },
  },
  {
    name: 'member_update',
    description: `Actualiza datos parciales de un socio.
Frases: "actualizá el teléfono de Juan", "cambiá email del socio 3".
Rol: business (staff solo socios asignados).`,
    inputSchema: z.object({
      member_id: z.number().int().positive(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      phone: z.string().optional(),
      password: z.string().min(6).optional(),
      activated: z.number().int().optional(),
      assign_staff_mem: z.number().int().optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { member_id, ...body } = args as { member_id: number } & Record<
        string,
        unknown
      >;
      const data = await client.request(`/members/${member_id}`, {
        method: 'PATCH',
        body,
      });
      return formatToolSuccess(data);
    },
  },
  {
    name: 'member_delete',
    description: `Elimina un socio. Requiere confirm: true.
Frases: "borrá el socio 5" (solo tras confirmación explícita del usuario).
Rol: administrator.`,
    inputSchema: z.object({
      member_id: z.number().int().positive(),
      confirm: z.literal(true).describe('Debe ser true para ejecutar'),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { member_id, confirm } = args as {
        member_id: number;
        confirm: boolean;
      };
      if (!confirm) throw new Error('confirm debe ser true');
      const data = await client.request(`/members/${member_id}`, {
        method: 'DELETE',
      });
      return formatToolSuccess(data);
    },
  },
];

import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';

export const activityTools: ToolDefinition[] = [
  {
    name: 'activity_list',
    description: `Lista ejercicios/actividades. Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      return formatToolSuccess(await client.request('/activities'));
    },
  },
  {
    name: 'activity_get',
    description: `Detalle de actividad/ejercicio. Rol: business.`,
    inputSchema: z.object({ activity_id: z.number().int().positive() }),
    minRole: 'business',
    async handler(client, args) {
      const { activity_id } = args as { activity_id: number };
      return formatToolSuccess(
        await client.request(`/activities/${activity_id}`),
      );
    },
  },
  {
    name: 'activity_create',
    description: `Crea actividad/ejercicio. Rol: business.
Requiere: title, category_id, difficulty_level, video_urls (array), trainer_member_ids (array).`,
    inputSchema: z.object({
      title: z.string(),
      category_id: z.number().int().positive(),
      difficulty_level: z.string(),
      video_urls: z.array(z.string()).min(1),
      trainer_member_ids: z.array(z.number().int().positive()).min(1),
      description: z.string().optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/activities', { method: 'POST', body: args }),
      );
    },
  },
  {
    name: 'activity_update',
    description: `Actualiza actividad. Rol: business.`,
    inputSchema: z.object({
      activity_id: z.number().int().positive(),
      title: z.string().optional(),
      category_id: z.number().int().optional(),
      difficulty_level: z.string().optional(),
      description: z.string().optional(),
      video_urls: z.array(z.string()).optional(),
      trainer_member_ids: z.array(z.number().int().positive()).optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { activity_id, ...body } = args as {
        activity_id: number;
      } & Record<string, unknown>;
      return formatToolSuccess(
        await client.request(`/activities/${activity_id}`, {
          method: 'PATCH',
          body,
        }),
      );
    },
  },
  {
    name: 'activity_category_list',
    description: `Lista categorías de actividades. Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      return formatToolSuccess(await client.request('/activities/categories'));
    },
  },
  {
    name: 'activity_category_create',
    description: `Crea categoría de actividad. Rol: business.`,
    inputSchema: z.object({ category_name: z.string() }),
    minRole: 'business',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/activities/categories', {
          method: 'POST',
          body: args,
        }),
      );
    },
  },
];

export const trainingTools: ToolDefinition[] = [
  {
    name: 'routine_list',
    description: `Lista rutinas de entrenamiento. Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      return formatToolSuccess(await client.request('/training-routines'));
    },
  },
  {
    name: 'routine_get',
    description: `Detalle de rutina. Rol: business.`,
    inputSchema: z.object({ routine_id: z.number().int().positive() }),
    minRole: 'business',
    async handler(client, args) {
      const { routine_id } = args as { routine_id: number };
      return formatToolSuccess(
        await client.request(`/training-routines/${routine_id}`),
      );
    },
  },
  {
    name: 'routine_create',
    description: `Crea rutina de entrenamiento. Rol: business.`,
    inputSchema: z.object({
      title: z.string(),
      description: z.string().optional(),
      lines: z
        .array(
          z.object({
            activity_id: z.number().int().positive(),
            weight_kg: z.number().optional(),
          }),
        )
        .min(1),
    }),
    minRole: 'business',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/training-routines', {
          method: 'POST',
          body: args,
        }),
      );
    },
  },
  {
    name: 'routine_update',
    description: `Actualiza rutina. Rol: business.`,
    inputSchema: z.object({
      routine_id: z.number().int().positive(),
      title: z.string().optional(),
      description: z.string().optional(),
      lines: z
        .array(
          z.object({
            activity_id: z.number().int().positive(),
            weight_kg: z.number().optional(),
          }),
        )
        .optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { routine_id, ...body } = args as {
        routine_id: number;
      } & Record<string, unknown>;
      return formatToolSuccess(
        await client.request(`/training-routines/${routine_id}`, {
          method: 'PATCH',
          body,
        }),
      );
    },
  },
  {
    name: 'routine_delete',
    description: `Elimina rutina. confirm: true. Rol: business.`,
    inputSchema: z.object({
      routine_id: z.number().int().positive(),
      confirm: z.literal(true),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { routine_id } = args as { routine_id: number };
      return formatToolSuccess(
        await client.request(`/training-routines/${routine_id}`, {
          method: 'DELETE',
        }),
      );
    },
  },
  {
    name: 'assignment_list',
    description: `Lista asignaciones rutina↔socio. Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      return formatToolSuccess(await client.request('/training-assignments'));
    },
  },
  {
    name: 'assignment_get',
    description: `Detalle asignación. Rol: business.`,
    inputSchema: z.object({ assignment_id: z.number().int().positive() }),
    minRole: 'business',
    async handler(client, args) {
      const { assignment_id } = args as { assignment_id: number };
      return formatToolSuccess(
        await client.request(`/training-assignments/${assignment_id}`),
      );
    },
  },
  {
    name: 'assignment_create',
    description: `Asigna rutina a socio.
Frases: "asigná rutina X a Juan". Rol: business.`,
    inputSchema: z.object({
      routine_id: z.number().int().positive(),
      member_ids: z.array(z.number().int().positive()).min(1),
      trainer_member_ids: z.array(z.number().int().positive()).min(1),
    }),
    minRole: 'business',
    async handler(client, args) {
      return formatToolSuccess(
        await client.request('/training-assignments', {
          method: 'POST',
          body: args,
        }),
      );
    },
  },
  {
    name: 'assignment_delete',
    description: `Quita asignación. confirm: true. Rol: business.`,
    inputSchema: z.object({
      assignment_id: z.number().int().positive(),
      confirm: z.literal(true),
    }),
    minRole: 'business',
    async handler(client, args) {
      const { assignment_id } = args as { assignment_id: number };
      return formatToolSuccess(
        await client.request(`/training-assignments/${assignment_id}`, {
          method: 'DELETE',
        }),
      );
    },
  },
];

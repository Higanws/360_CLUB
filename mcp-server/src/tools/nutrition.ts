import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import {
  addMealToPlan,
  planToUpsertBody,
  removeMealFromPlan,
  updateMealInPlan,
  type NutritionPlan,
} from '../orchestration/nutrition-plan-merge.js';
import { resolveMemberId } from '../orchestration/member-resolver.js';
import { resolveWeekday } from '../orchestration/weekday-parse.js';
import type { ToolDefinition } from './types.js';

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
});

const memberRefSchema = {
  member_id: z.number().int().positive().optional(),
  member_query: z
    .string()
    .optional()
    .describe('Nombre/DNI si no tenés member_id'),
};

async function loadPlan(
  client: import('../client/club360-client.js').Club360Client,
  memberId: number,
): Promise<NutritionPlan> {
  const plan = await client.request<NutritionPlan>(
    `/nutrition/members/${memberId}/plan`,
  );
  return {
    ...plan,
    schedule_slots: plan.schedule_slots ?? [],
  };
}

async function savePlan(
  client: import('../client/club360-client.js').Club360Client,
  memberId: number,
  plan: NutritionPlan,
) {
  return client.request(`/nutrition/members/${memberId}/plan`, {
    method: 'PUT',
    body: planToUpsertBody(plan),
  });
}

export const nutritionTools: ToolDefinition[] = [
  {
    name: 'nutrition_overview',
    description: `Resumen de planes nutricionales de todos los socios visibles.
Frases: "¿quién tiene dieta?", "overview nutrición".
Rol: business.`,
    inputSchema: z.object({}),
    minRole: 'business',
    async handler(client) {
      const data = await client.request('/nutrition/overview');
      return formatToolSuccess(data);
    },
  },
  {
    name: 'nutrition_plan_get',
    description: `Plan nutricional completo de un socio.
Frases: "mostrá la dieta de Juan", "plan nutricional id 5".`,
    inputSchema: z.object(memberRefSchema),
    minRole: 'business',
    async handler(client, args) {
      const a = args as { member_id?: number; member_query?: string };
      const memberId = await resolveMemberId(client, a);
      const data = await loadPlan(client, memberId);
      return formatToolSuccess(data);
    },
  },
  {
    name: 'nutrition_meal_update',
    description: `Cambia plato/ingredientes de una comida existente (GET+merge+PUT interno).
Frases: "cambiá el almuerzo del lunes de Juan", "poné ensalada en la cena del martes".
Params: member_id o member_query, weekday_name o weekday, meal_event y/o hour, dish, ingredients.
Ver club360://guide/nutrition-model`,
    inputSchema: z.object({
      ...memberRefSchema,
      weekday: z.number().int().min(0).max(6).optional(),
      weekday_name: z.string().optional(),
      hour: z.number().int().min(5).max(23).optional(),
      meal_event: z.string().optional().describe('Ej. Almuerzo, Cena'),
      dish: z.string().optional(),
      ingredients: z.array(ingredientSchema).optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const a = args as {
        member_id?: number;
        member_query?: string;
        weekday?: number;
        weekday_name?: string;
        hour?: number;
        meal_event?: string;
        dish?: string;
        ingredients?: { name: string; quantity: string }[];
      };
      const memberId = await resolveMemberId(client, a);
      const weekday = resolveWeekday(a.weekday, a.weekday_name);
      let plan = await loadPlan(client, memberId);
      plan = updateMealInPlan(plan, {
        weekday,
        hour: a.hour,
        mealEvent: a.meal_event,
        dish: a.dish,
        ingredients: a.ingredients,
      });
      const saved = await savePlan(client, memberId, plan);
      return formatToolSuccess(saved);
    },
  },
  {
    name: 'nutrition_meal_add',
    description: `Agrega una franja de comida nueva al plan.
Frases: "agregá desayuno los lunes a las 8", "nueva comida cena viernes".`,
    inputSchema: z.object({
      ...memberRefSchema,
      weekday: z.number().int().min(0).max(6).optional(),
      weekday_name: z.string().optional(),
      hour: z.number().int().min(5).max(23),
      meal_event: z.string(),
      dish: z.string().optional(),
      ingredients: z.array(ingredientSchema).optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const a = args as {
        member_id?: number;
        member_query?: string;
        weekday?: number;
        weekday_name?: string;
        hour: number;
        meal_event: string;
        dish?: string;
        ingredients?: { name: string; quantity: string }[];
      };
      const memberId = await resolveMemberId(client, a);
      const weekday = resolveWeekday(a.weekday, a.weekday_name);
      let plan = await loadPlan(client, memberId);
      plan = addMealToPlan(plan, {
        weekday,
        hour: a.hour,
        event: a.meal_event,
        dish: a.dish ?? null,
        ingredients: a.ingredients ?? null,
      });
      const saved = await savePlan(client, memberId, plan);
      return formatToolSuccess(saved);
    },
  },
  {
    name: 'nutrition_meal_remove',
    description: `Elimina una franja del plan nutricional.
Frases: "sacá la merienda del miércoles", "quitar cena del viernes".`,
    inputSchema: z.object({
      ...memberRefSchema,
      weekday: z.number().int().min(0).max(6).optional(),
      weekday_name: z.string().optional(),
      hour: z.number().int().min(5).max(23).optional(),
      meal_event: z.string().optional(),
    }),
    minRole: 'business',
    async handler(client, args) {
      const a = args as {
        member_id?: number;
        member_query?: string;
        weekday?: number;
        weekday_name?: string;
        hour?: number;
        meal_event?: string;
      };
      const memberId = await resolveMemberId(client, a);
      const weekday = resolveWeekday(a.weekday, a.weekday_name);
      let plan = await loadPlan(client, memberId);
      plan = removeMealFromPlan(plan, {
        weekday,
        hour: a.hour,
        mealEvent: a.meal_event,
      });
      const saved = await savePlan(client, memberId, plan);
      return formatToolSuccess(saved);
    },
  },
];

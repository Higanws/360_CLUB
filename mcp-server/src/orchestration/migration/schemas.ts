import { z } from 'zod';
import type { MigrationEntityType } from './requirements.js';

const gender = z.enum(['male', 'female', 'other']);
const dniType = z.enum(['DI', 'DNI']);
const difficulty = z.enum(['baja', 'media', 'alta']);

const sourceId = z.string().min(1).optional();

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
});

const scheduleSlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  hour: z.number().int().min(5).max(23),
  event: z.string().min(1),
  dish: z.string().nullable().optional(),
  ingredients: z.array(ingredientSchema).nullable().optional(),
});

const routineLineSchema = z.object({
  activity_id: z.number().int().positive().optional(),
  activity_ref: z.string().min(1).optional(),
  weight_kg: z.number().min(0).max(999.99).nullable().optional(),
  weekdays_mask: z.number().int().min(1).max(127).optional(),
});

export const migrationItemSchemas: Record<
  MigrationEntityType,
  z.ZodTypeAny
> = {
  membership_plan: z.object({
    source_id: sourceId,
    membership_label: z.string().min(1),
    membership_amount: z.number().min(0),
    membership_period_days: z.number().int().min(1).optional(),
    installment_plan: z.string().optional(),
    signup_fee: z.number().min(0).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
  activity_category: z.object({
    source_id: sourceId,
    name: z.string().min(1),
  }),
  activity: z.object({
    source_id: sourceId,
    category_id: z.number().int().positive().optional(),
    category_ref: z.string().min(1).optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    difficulty_level: difficulty,
    video_urls: z.array(z.string()),
    trainer_member_ids: z.array(z.number().int().positive()).optional(),
    trainer_refs: z.array(z.string().min(1)).optional(),
  }),
  staff: z.object({
    source_id: sourceId,
    first_name: z.string().min(1),
    middle_name: z.string().optional(),
    last_name: z.string().min(1),
    gender,
    birth_date: z.string().min(1),
    role: z.number().int(),
    specialization_ids: z.array(z.number().int()).min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zipcode: z.string().optional(),
    mobile: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(6),
  }),
  member: z.object({
    source_id: sourceId,
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    username: z.string().min(3),
    password: z.string().min(6),
    gender,
    di_dni_type: dniType,
    di_dni_number: z.string().min(1),
    email: z.string().email().optional(),
    mobile: z.string().optional(),
    phone: z.string().optional(),
    birth_date: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipcode: z.string().optional(),
    selected_membership: z.string().optional(),
    membership_ref: z.string().min(1).optional(),
    assign_staff_mem: z.number().int().positive().optional(),
    staff_ref: z.string().min(1).optional(),
    membership_valid_from: z.string().optional(),
    membership_valid_to: z.string().optional(),
    activated: z.number().int().min(0).max(1).optional(),
    subscribe_nutrition_general: z.boolean().optional(),
    subscribe_training_general: z.boolean().optional(),
    physical_weight_kg: z.number().optional(),
    physical_height_cm: z.number().optional(),
    physical_chest_cm: z.number().optional(),
    physical_waist_cm: z.number().optional(),
    physical_thigh_cm: z.number().optional(),
    physical_arms_cm: z.number().optional(),
    physical_fat_percent: z.number().optional(),
  }),
  training_routine: z.object({
    source_id: sourceId,
    title: z.string().min(1),
    description: z.string().optional(),
    lines: z.array(routineLineSchema).min(1),
  }),
  training_assignment: z.object({
    source_id: sourceId,
    routine_id: z.number().int().positive().optional(),
    routine_ref: z.string().min(1).optional(),
    member_ids: z.array(z.number().int().positive()).optional(),
    member_refs: z.array(z.string().min(1)).optional(),
    trainer_member_ids: z.array(z.number().int().positive()).optional(),
    trainer_refs: z.array(z.string().min(1)).optional(),
  }),
  nutrition_plan: z.object({
    source_id: sourceId,
    member_id: z.number().int().positive().optional(),
    member_ref: z.string().min(1).optional(),
    valid_from: z.string().optional(),
    valid_to: z.string().optional(),
    schedule_slots: z.array(scheduleSlotSchema).min(1),
  }),
};

export const migrationEntityTypeSchema = z.enum([
  'membership_plan',
  'activity_category',
  'activity',
  'staff',
  'member',
  'training_routine',
  'training_assignment',
  'nutrition_plan',
]);

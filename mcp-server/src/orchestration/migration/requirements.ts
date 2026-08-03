/** Metadatos de requisitos por entidad para modo migración (espejo de DTOs backend). */

export type MigrationEntityType =
  | 'membership_plan'
  | 'activity_category'
  | 'activity'
  | 'staff'
  | 'member'
  | 'training_routine'
  | 'training_assignment'
  | 'nutrition_plan';

export type FieldSpec = {
  name: string;
  type: string;
  required: boolean;
  notes?: string;
};

export type EntityRequirements = {
  entity_type: MigrationEntityType;
  table: string;
  api: { method: string; path: string };
  min_role: 'administrator' | 'business';
  depends_on: MigrationEntityType[];
  required_fields: FieldSpec[];
  optional_fields: FieldSpec[];
  batch_notes: string[];
};

export const MIGRATION_PHASES: Array<{
  phase: number;
  title: string;
  entity_types: MigrationEntityType[];
  description: string;
}> = [
  {
    phase: 1,
    title: 'Catálogos base',
    entity_types: ['membership_plan', 'activity_category'],
    description:
      'Planes de membresía y categorías de ejercicios. Sin dependencias externas.',
  },
  {
    phase: 2,
    title: 'Staff y ejercicios',
    entity_types: ['staff', 'activity'],
    description:
      'Entrenadores (staff) y actividades/ejercicios. Las actividades requieren category_id y trainer_member_ids (staff).',
  },
  {
    phase: 3,
    title: 'Socios',
    entity_types: ['member'],
    description:
      'Altas masivas de clientes. Opcionalmente vincular plan (selected_membership) y entrenador (assign_staff_mem).',
  },
  {
    phase: 4,
    title: 'Rutinas y asignaciones',
    entity_types: ['training_routine', 'training_assignment'],
    description:
      'Rutinas de entrenamiento (líneas con activity_id) y asignación a socios + entrenadores.',
  },
  {
    phase: 5,
    title: 'Nutrición',
    entity_types: ['nutrition_plan'],
    description:
      'Plan semanal por socio (schedule_slots). Requiere member_id o member_ref del id_map.',
  },
];

const gender = 'male | female | other';
const dniType = 'DI | DNI';
const difficulty = 'baja | media | alta';

export const ENTITY_REQUIREMENTS: Record<
  MigrationEntityType,
  EntityRequirements
> = {
  membership_plan: {
    entity_type: 'membership_plan',
    table: 'membership',
    api: { method: 'POST', path: '/memberships' },
    min_role: 'administrator',
    depends_on: [],
    required_fields: [
      { name: 'membership_label', type: 'string', required: true },
      { name: 'membership_amount', type: 'number (≥0)', required: true },
    ],
    optional_fields: [
      { name: 'membership_period_days', type: 'integer (≥1)', required: false },
      { name: 'installment_plan', type: 'string', required: false },
      { name: 'signup_fee', type: 'number (≥0)', required: false },
      { name: 'description', type: 'string', required: false },
      { name: 'image', type: 'string (URL/path)', required: false },
    ],
    batch_notes: [
      'Usá source_id en cada ítem para mapear legacy → id nuevo (ej. "plan-mensual").',
      'Los socios referencian el plan con selected_membership (id numérico) o membership_ref en id_map.',
    ],
  },
  activity_category: {
    entity_type: 'activity_category',
    table: 'activity_category',
    api: { method: 'POST', path: '/activities/categories' },
    min_role: 'business',
    depends_on: [],
    required_fields: [{ name: 'name', type: 'string', required: true }],
    optional_fields: [],
    batch_notes: [
      'Campo API: name (no category_name).',
      'Guardá source_id para resolver category_ref al importar actividades.',
    ],
  },
  activity: {
    entity_type: 'activity',
    table: 'activity',
    api: { method: 'POST', path: '/activities' },
    min_role: 'business',
    depends_on: ['activity_category', 'staff'],
    required_fields: [
      {
        name: 'category_id',
        type: 'integer | category_ref',
        required: true,
        notes: 'ID de categoría o clave en id_map',
      },
      { name: 'title', type: 'string', required: true },
      { name: 'difficulty_level', type: difficulty, required: true },
      {
        name: 'video_urls',
        type: 'string[]',
        required: true,
        notes: 'URLs YouTube; puede ser [] si no hay videos',
      },
      {
        name: 'trainer_member_ids',
        type: 'integer[] | trainer_refs[]',
        required: true,
        notes: 'IDs gym_member del staff entrenador',
      },
    ],
    optional_fields: [{ name: 'description', type: 'string', required: false }],
    batch_notes: [
      'Importar categorías y staff antes.',
      'En lote: category_ref, trainer_refs[] resuelven vía id_map.',
    ],
  },
  staff: {
    entity_type: 'staff',
    table: 'gym_member (+ staff)',
    api: { method: 'POST', path: '/staff' },
    min_role: 'administrator',
    depends_on: [],
    required_fields: [
      { name: 'first_name', type: 'string', required: true },
      { name: 'last_name', type: 'string', required: true },
      { name: 'gender', type: gender, required: true },
      { name: 'birth_date', type: 'YYYY-MM-DD', required: true },
      { name: 'role', type: 'integer', required: true, notes: 'ID rol staff (ver GET /staff/form-options)' },
      {
        name: 'specialization_ids',
        type: 'integer[] (≥1)',
        required: true,
        notes: 'IDs especialización (form-options)',
      },
      { name: 'address', type: 'string', required: true },
      { name: 'city', type: 'string', required: true },
      { name: 'mobile', type: 'string', required: true },
      { name: 'email', type: 'string (email)', required: true },
      { name: 'username', type: 'string (≥3)', required: true },
      { name: 'password', type: 'string (≥6)', required: true },
    ],
    optional_fields: [
      { name: 'middle_name', type: 'string', required: false },
      { name: 'state', type: 'string', required: false },
      { name: 'zipcode', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
    ],
    batch_notes: [
      'Antes del lote: migration_import_batch con dry_run o GET /staff/form-options para role y specialization_ids.',
      'source_id permite trainer_refs en actividades y assign_staff_mem en socios.',
    ],
  },
  member: {
    entity_type: 'member',
    table: 'gym_member',
    api: { method: 'POST', path: '/members' },
    min_role: 'administrator',
    depends_on: ['membership_plan', 'staff'],
    required_fields: [
      { name: 'first_name', type: 'string', required: true },
      { name: 'last_name', type: 'string', required: true },
      { name: 'username', type: 'string (≥3)', required: true },
      { name: 'password', type: 'string (≥6)', required: true },
      { name: 'gender', type: gender, required: true },
      { name: 'di_dni_type', type: dniType, required: true },
      { name: 'di_dni_number', type: 'string', required: true },
    ],
    optional_fields: [
      { name: 'email', type: 'string', required: false },
      { name: 'mobile', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
      { name: 'birth_date', type: 'YYYY-MM-DD', required: false },
      { name: 'address', type: 'string', required: false },
      { name: 'city', type: 'string', required: false },
      { name: 'selected_membership', type: 'string (id plan)', required: false },
      {
        name: 'membership_ref',
        type: 'string (id_map)',
        required: false,
        notes: 'Alternativa a selected_membership',
      },
      { name: 'assign_staff_mem', type: 'integer', required: false },
      { name: 'staff_ref', type: 'string (id_map)', required: false },
      { name: 'membership_valid_from', type: 'YYYY-MM-DD', required: false },
      { name: 'membership_valid_to', type: 'YYYY-MM-DD', required: false },
      { name: 'activated', type: '0 | 1', required: false },
      {
        name: 'subscribe_nutrition_general',
        type: 'boolean',
        required: false,
      },
      {
        name: 'subscribe_training_general',
        type: 'boolean',
        required: false,
      },
      { name: 'physical_*', type: 'medidas corporales', required: false },
    ],
    batch_notes: [
      'Usernames y DNI deben ser únicos.',
      'GET /members/form-options lista planes y staff disponibles.',
    ],
  },
  training_routine: {
    entity_type: 'training_routine',
    table: 'training_routine + training_routine_line',
    api: { method: 'POST', path: '/training-routines' },
    min_role: 'business',
    depends_on: ['activity'],
    required_fields: [
      { name: 'title', type: 'string', required: true },
      {
        name: 'lines',
        type: 'array (≥1)',
        required: true,
        notes: 'Cada línea: activity_id o activity_ref, weight_kg?, weekdays_mask? (1-127, default 127)',
      },
    ],
    optional_fields: [{ name: 'description', type: 'string', required: false }],
    batch_notes: [
      'weekdays_mask: bitmask Lun–Dom (1+2+4+8+16+32+64).',
      'source_id para routine_ref en asignaciones.',
    ],
  },
  training_assignment: {
    entity_type: 'training_assignment',
    table: 'training_assignment',
    api: { method: 'POST', path: '/training-assignments' },
    min_role: 'business',
    depends_on: ['training_routine', 'member', 'staff'],
    required_fields: [
      {
        name: 'routine_id',
        type: 'integer | routine_ref',
        required: true,
      },
      {
        name: 'member_ids',
        type: 'integer[] | member_refs[]',
        required: true,
        notes: '≥1 socio',
      },
      {
        name: 'trainer_member_ids',
        type: 'integer[] | trainer_refs[]',
        required: true,
        notes: '≥1 entrenador staff',
      },
    ],
    optional_fields: [],
    batch_notes: [
      'Un POST puede asignar la misma rutina a varios socios.',
      'member_refs / trainer_refs / routine_ref usan id_map acumulado de fases previas.',
    ],
  },
  nutrition_plan: {
    entity_type: 'nutrition_plan',
    table: 'nutrition_plan',
    api: { method: 'PUT', path: '/nutrition/members/:memberId/plan' },
    min_role: 'business',
    depends_on: ['member'],
    required_fields: [
      {
        name: 'member_id',
        type: 'integer | member_ref',
        required: true,
        notes: 'Socio destino (no va en body PUT, va en URL)',
      },
      {
        name: 'schedule_slots',
        type: 'array',
        required: true,
        notes: 'weekday 0-6 (0=dom), hour 5-23, event, dish?, ingredients[]?',
      },
    ],
    optional_fields: [
      { name: 'valid_from', type: 'YYYY-MM-DD', required: false },
      { name: 'valid_to', type: 'YYYY-MM-DD', required: false },
    ],
    batch_notes: [
      'Upsert completo: reemplaza el plan del socio.',
      'Ver club360://guide/nutrition-model para weekday/hour/event.',
    ],
  },
};

export function getRequirements(
  entityType?: MigrationEntityType,
): EntityRequirements | EntityRequirements[] {
  if (entityType) return ENTITY_REQUIREMENTS[entityType];
  return Object.values(ENTITY_REQUIREMENTS);
}

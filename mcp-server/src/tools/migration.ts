import { z } from 'zod';
import { formatToolSuccess } from '../client/errors.js';
import type { ToolDefinition } from './types.js';
import {
  ENTITY_REQUIREMENTS,
  getRequirements,
  MIGRATION_PHASES,
  type MigrationEntityType,
} from '../orchestration/migration/requirements.js';
import {
  runMigrationBatch,
  validateBatchItems,
} from '../orchestration/migration/batch-runner.js';
import { migrationEntityTypeSchema } from '../orchestration/migration/schemas.js';

const entityTypeSchema = migrationEntityTypeSchema;

const idMapSchema = z
  .record(z.string(), z.number().int().positive())
  .optional()
  .default({});

export const migrationTools: ToolDefinition[] = [
  {
    name: 'migration_requirements',
    description: `Modo migración: requisitos de campos por entidad/tabla antes de importar lotes.
Frases: "qué campos necesito para cargar socios", "requisitos tabla rutinas".
Devuelve required_fields, optional_fields, depends_on y endpoint API.
Leé también club360://guide/migration.
Rol: administrator.`,
    inputSchema: z.object({
      entity_type: entityTypeSchema
        .optional()
        .describe(
          'Filtrar una entidad. Omitir para listar todas (membership_plan, activity_category, activity, staff, member, training_routine, training_assignment, nutrition_plan).',
        ),
    }),
    minRole: 'administrator',
    async handler(_client, args) {
      const { entity_type } = args as { entity_type?: MigrationEntityType };
      const data = getRequirements(entity_type);
      return formatToolSuccess({
        guide: 'club360://guide/migration',
        entities: data,
      });
    },
  },
  {
    name: 'migration_plan',
    description: `Modo migración: orden de fases y dependencias para importar datos legacy en lotes.
Frases: "en qué orden migro clientes y rutinas", "plan de migración Club360".
Usá id_map entre fases (source_id → id creado).
Rol: administrator.`,
    inputSchema: z.object({}),
    minRole: 'administrator',
    async handler() {
      return formatToolSuccess({
        guide: 'club360://guide/migration',
        phases: MIGRATION_PHASES,
        entity_summary: Object.values(ENTITY_REQUIREMENTS).map((e) => ({
          entity_type: e.entity_type,
          table: e.table,
          depends_on: e.depends_on,
          api: e.api,
        })),
        id_map_hint:
          'Acumulá id_map_updates de cada migration_import_batch y pasalo en el siguiente lote como id_map.',
      });
    },
  },
  {
    name: 'migration_validate_batch',
    description: `Modo migración: valida un lote SIN crear registros (dry run).
Frases: "validá estos 50 socios antes de importar", "revisá el CSV de rutinas".
Mismo formato que migration_import_batch pero solo Zod + resolución de refs.
Rol: administrator.`,
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      items: z.array(z.record(z.unknown())).min(1).max(200),
      id_map: idMapSchema,
    }),
    minRole: 'administrator',
    async handler(_client, args) {
      const { entity_type, items, id_map } = args as {
        entity_type: MigrationEntityType;
        items: unknown[];
        id_map: Record<string, number>;
      };
      const result = validateBatchItems(entity_type, items, id_map ?? {});
      return formatToolSuccess(result);
    },
  },
  {
    name: 'migration_import_batch',
    description: `Modo migración: importa un lote de registros (máx. 200 por llamada).
Frases: "importá estos clientes", "cargá rutinas en lote desde migración".
Siempre validá antes con migration_validate_batch o dry_run:true.
Cada ítem puede llevar source_id; la respuesta devuelve id_map_updates para fases siguientes.
Refs: category_ref, activity_ref, member_ref, staff_ref, trainer_refs, routine_ref, membership_ref.
Rol: administrator.`,
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      items: z.array(z.record(z.unknown())).min(1).max(200),
      dry_run: z.boolean().optional().default(false),
      continue_on_error: z
        .boolean()
        .optional()
        .default(true)
        .describe('Si true, sigue tras un ítem fallido'),
      id_map: idMapSchema.describe(
        'Mapa source_id → id Club360 de lotes anteriores',
      ),
    }),
    minRole: 'administrator',
    async handler(client, args) {
      const { entity_type, items, dry_run, continue_on_error, id_map } =
        args as {
          entity_type: MigrationEntityType;
          items: unknown[];
          dry_run?: boolean;
          continue_on_error?: boolean;
          id_map?: Record<string, number>;
        };

      if (entity_type === 'staff') {
        await client.request('/staff/form-options');
      }
      if (entity_type === 'member') {
        await client.request('/members/form-options');
      }

      const result = await runMigrationBatch(client, entity_type, items, {
        dry_run: dry_run ?? false,
        continue_on_error: continue_on_error ?? true,
        id_map: id_map ?? {},
      });
      return formatToolSuccess(result);
    },
  },
];

import type { Club360Client } from '../../client/club360-client.js';
import type { MigrationEntityType } from './requirements.js';
import { migrationItemSchemas } from './schemas.js';
import {
  extractCreatedId,
  resolveId,
  resolveIdList,
  type IdMap,
} from './resolve-refs.js';

export type BatchItemResult = {
  index: number;
  source_id?: string;
  ok: boolean;
  id?: number;
  error?: string;
  dry_run?: boolean;
};

export type BatchRunResult = {
  entity_type: MigrationEntityType;
  dry_run: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: BatchItemResult[];
  id_map_updates: IdMap;
};

type ItemRecord = Record<string, unknown>;

function stripMeta(item: ItemRecord): ItemRecord {
  const { source_id: _s, ...rest } = item;
  return rest;
}

function buildActivityBody(item: ItemRecord, idMap: IdMap): ItemRecord {
  const categoryId = item.category_id ?? resolveId(item.category_ref as string, idMap, 'category_ref');
  const trainers = resolveIdList(
    item.trainer_member_ids as number[] | undefined,
    item.trainer_refs as string[] | undefined,
    idMap,
    'trainer_refs',
  );
  return {
    category_id: categoryId,
    title: item.title,
    description: item.description,
    difficulty_level: item.difficulty_level,
    video_urls: item.video_urls ?? [],
    trainer_member_ids: trainers,
  };
}

function buildMemberBody(item: ItemRecord, idMap: IdMap): ItemRecord {
  const body = stripMeta(item);
  delete body.membership_ref;
  delete body.staff_ref;
  if (item.membership_ref && !body.selected_membership) {
    const planId = resolveId(item.membership_ref as string, idMap, 'membership_ref');
    body.selected_membership = String(planId);
  }
  if (item.staff_ref && !body.assign_staff_mem) {
    body.assign_staff_mem = resolveId(item.staff_ref as string, idMap, 'staff_ref');
  }
  return body;
}

function buildRoutineBody(item: ItemRecord, idMap: IdMap): ItemRecord {
  const lines = (item.lines as ItemRecord[]).map((line, i) => {
    const activityId =
      line.activity_id ??
      resolveId(line.activity_ref as string, idMap, `lines[${i}].activity_ref`);
    return {
      activity_id: activityId,
      weight_kg: line.weight_kg ?? null,
      weekdays_mask: line.weekdays_mask ?? 127,
    };
  });
  return {
    title: item.title,
    description: item.description,
    lines,
  };
}

function buildAssignmentBody(item: ItemRecord, idMap: IdMap): ItemRecord {
  const routineId =
    item.routine_id ?? resolveId(item.routine_ref as string, idMap, 'routine_ref');
  const memberIds = resolveIdList(
    item.member_ids as number[] | undefined,
    item.member_refs as string[] | undefined,
    idMap,
    'member_refs',
  );
  const trainerIds = resolveIdList(
    item.trainer_member_ids as number[] | undefined,
    item.trainer_refs as string[] | undefined,
    idMap,
    'trainer_refs',
  );
  return {
    routine_id: routineId,
    member_ids: memberIds,
    trainer_member_ids: trainerIds,
  };
}

function buildNutritionBody(item: ItemRecord, idMap: IdMap): {
  memberId: number;
  body: ItemRecord;
} {
  const memberId =
    typeof item.member_id === 'number'
      ? item.member_id
      : resolveId(item.member_ref as string, idMap, 'member_ref');
  return {
    memberId,
    body: {
      valid_from: item.valid_from,
      valid_to: item.valid_to,
      schedule_slots: item.schedule_slots,
    },
  };
}

async function postItem(
  client: Club360Client,
  entityType: MigrationEntityType,
  item: ItemRecord,
  idMap: IdMap,
): Promise<{ data: unknown; id?: number }> {
  switch (entityType) {
    case 'membership_plan':
      return {
        data: await client.request('/memberships', {
          method: 'POST',
          body: stripMeta(item),
        }),
      };
    case 'activity_category':
      return {
        data: await client.request('/activities/categories', {
          method: 'POST',
          body: stripMeta(item),
        }),
      };
    case 'activity':
      return {
        data: await client.request('/activities', {
          method: 'POST',
          body: buildActivityBody(item, idMap),
        }),
      };
    case 'staff':
      return {
        data: await client.request('/staff', {
          method: 'POST',
          body: stripMeta(item),
        }),
      };
    case 'member':
      return {
        data: await client.request('/members', {
          method: 'POST',
          body: buildMemberBody(item, idMap),
        }),
      };
    case 'training_routine':
      return {
        data: await client.request('/training-routines', {
          method: 'POST',
          body: buildRoutineBody(item, idMap),
        }),
      };
    case 'training_assignment':
      return {
        data: await client.request('/training-assignments', {
          method: 'POST',
          body: buildAssignmentBody(item, idMap),
        }),
      };
    case 'nutrition_plan': {
      const { memberId, body } = buildNutritionBody(item, idMap);
      const data = await client.request(`/nutrition/members/${memberId}/plan`, {
        method: 'PUT',
        body,
      });
      return { data, id: memberId };
    }
    default:
      throw new Error(`Tipo no soportado: ${entityType}`);
  }
}

export async function runMigrationBatch(
  client: Club360Client,
  entityType: MigrationEntityType,
  items: unknown[],
  opts: {
    dry_run: boolean;
    continue_on_error: boolean;
    id_map: IdMap;
  },
): Promise<BatchRunResult> {
  const schema = migrationItemSchemas[entityType];
  const results: BatchItemResult[] = [];
  const idMapUpdates: IdMap = {};
  let succeeded = 0;
  let failed = 0;

  for (let index = 0; index < items.length; index++) {
    const raw = items[index];
    const sourceId =
      raw && typeof raw === 'object' && 'source_id' in raw
        ? String((raw as ItemRecord).source_id ?? '')
        : undefined;

    try {
      const parsed = schema.parse(raw) as ItemRecord;
      const sid = parsed.source_id ? String(parsed.source_id) : sourceId;

      if (opts.dry_run) {
        if (entityType !== 'membership_plan' && entityType !== 'activity_category') {
          postItemDryValidate(entityType, parsed, opts.id_map);
        }
        succeeded++;
        results.push({
          index,
          source_id: sid,
          ok: true,
          dry_run: true,
        });
        continue;
      }

      const { data, id } = await postItem(client, entityType, parsed, opts.id_map);
      const createdId = id ?? extractCreatedId(data);
      if (sid && createdId) {
        idMapUpdates[sid] = createdId;
      }
      succeeded++;
      results.push({
        index,
        source_id: sid,
        ok: true,
        id: createdId,
      });
    } catch (err) {
      failed++;
      results.push({
        index,
        source_id: sourceId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      if (!opts.continue_on_error) break;
    }
  }

  return {
    entity_type: entityType,
    dry_run: opts.dry_run,
    total: items.length,
    succeeded,
    failed,
    results,
    id_map_updates: idMapUpdates,
  };
}

/** Resuelve refs sin llamar API (validación en dry_run). */
function postItemDryValidate(
  entityType: MigrationEntityType,
  item: ItemRecord,
  idMap: IdMap,
): void {
  switch (entityType) {
    case 'activity':
      buildActivityBody(item, idMap);
      break;
    case 'member':
      buildMemberBody(item, idMap);
      break;
    case 'training_routine':
      buildRoutineBody(item, idMap);
      break;
    case 'training_assignment':
      buildAssignmentBody(item, idMap);
      break;
    case 'nutrition_plan':
      buildNutritionBody(item, idMap);
      break;
    default:
      break;
  }
}

export function validateBatchItems(
  entityType: MigrationEntityType,
  items: unknown[],
  idMap: IdMap,
): BatchRunResult {
  const schema = migrationItemSchemas[entityType];
  const results: BatchItemResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let index = 0; index < items.length; index++) {
    const raw = items[index];
    const sourceId =
      raw && typeof raw === 'object' && 'source_id' in raw
        ? String((raw as ItemRecord).source_id ?? '')
        : undefined;
    try {
      const parsed = schema.parse(raw) as ItemRecord;
      postItemDryValidate(entityType, parsed, idMap);
      succeeded++;
      results.push({ index, source_id: sourceId, ok: true, dry_run: true });
    } catch (err) {
      failed++;
      results.push({
        index,
        source_id: sourceId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    entity_type: entityType,
    dry_run: true,
    total: items.length,
    succeeded,
    failed,
    results,
    id_map_updates: {},
  };
}

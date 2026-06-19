export type IdMap = Record<string, number>;

export function resolveId(
  value: number | string | undefined,
  idMap: IdMap,
  fieldName: string,
): number {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Falta ${fieldName}`);
  }
  if (typeof value === 'number') return value;
  const key = String(value).trim();
  const mapped = idMap[key];
  if (mapped === undefined) {
    throw new Error(
      `Ref "${key}" no encontrada en id_map para ${fieldName}. Importá la entidad referenciada antes o pasá el id numérico.`,
    );
  }
  return mapped;
}

export function resolveIdList(
  ids: number[] | undefined,
  refs: string[] | undefined,
  idMap: IdMap,
  fieldName: string,
): number[] {
  const fromIds = ids ?? [];
  const fromRefs = (refs ?? []).map((r) => resolveId(r, idMap, fieldName));
  const merged = [...fromIds, ...fromRefs];
  if (merged.length === 0) {
    throw new Error(`${fieldName}: indicá ids numéricos o refs en id_map`);
  }
  return merged;
}

/** Extrae id numérico de respuesta POST típica del backend. */
export function extractCreatedId(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, unknown>;
  for (const key of ['id', 'member_id', 'routine_id', 'assignment_id']) {
    const v = o[key];
    if (typeof v === 'number' && v > 0) return v;
  }
  if (o.member && typeof o.member === 'object') {
    const mid = (o.member as Record<string, unknown>).id;
    if (typeof mid === 'number') return mid;
  }
  return undefined;
}

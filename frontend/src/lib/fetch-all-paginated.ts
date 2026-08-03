import { api } from './api';
import type { PaginatedMeta } from './pagination';

/** Máximo `pageSize` aceptado por `PaginationQueryDto` en la API. */
export const API_MAX_PAGE_SIZE = 100;

type ListKey = string;

/**
 * Carga todas las páginas de un listado paginado (pageSize ≤ 100).
 * `itemsKey` es la propiedad del array (p. ej. `activities`, `routines`, `staff`).
 */
export async function fetchAllPaginatedRows<T>(
  path: string,
  itemsKey: ListKey,
  extraParams?: Record<string, string | number | undefined>,
): Promise<T[]> {
  const pageSize = API_MAX_PAGE_SIZE;
  const first = await api.get<Record<string, unknown>>(path, {
    params: { page: 1, pageSize, ...extraParams },
  });
  const data = first.data;
  const raw = data[itemsKey];
  const firstItems = Array.isArray(raw) ? (raw as T[]) : [];
  const meta = data.meta as PaginatedMeta | undefined;
  const pageCount = Math.max(1, Number(meta?.pageCount ?? 1));
  if (pageCount <= 1) return firstItems;

  const rest: T[] = [];
  for (let page = 2; page <= pageCount; page++) {
    const { data: pageData } = await api.get<Record<string, unknown>>(path, {
      params: { page, pageSize, ...extraParams },
    });
    const rows = pageData[itemsKey];
    if (Array.isArray(rows)) rest.push(...(rows as T[]));
  }
  return [...firstItems, ...rest];
}

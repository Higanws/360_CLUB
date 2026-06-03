export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type PaginatedResponse<T, K extends string = 'items'> = {
  meta: PaginatedMeta;
} & Record<K, T[]>;

export function pageRangeLabel(meta: PaginatedMeta): string {
  if (meta.total === 0) return '0 resultados';
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);
  return `${from}–${to} de ${meta.total}`;
}

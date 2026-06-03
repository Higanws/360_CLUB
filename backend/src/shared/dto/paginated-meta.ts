export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export function buildPageMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginatedMeta {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  return {
    page,
    pageSize: safePageSize,
    total,
    pageCount,
  };
}

export function paginationSkip(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * Math.max(1, pageSize);
}

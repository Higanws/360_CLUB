import {
  buildPageMeta,
  paginationSkip,
} from '../../../src/shared/dto/paginated-meta';

describe('shared / paginated-meta', () => {
  it('buildPageMeta calcula pageCount', () => {
    expect(buildPageMeta(0, 1, 25)).toEqual({
      page: 1,
      pageSize: 25,
      total: 0,
      pageCount: 1,
    });
    expect(buildPageMeta(26, 1, 25)).toEqual({
      page: 1,
      pageSize: 25,
      total: 26,
      pageCount: 2,
    });
    expect(buildPageMeta(26, 2, 25).pageCount).toBe(2);
  });

  it('paginationSkip offset correcto', () => {
    expect(paginationSkip(1, 25)).toBe(0);
    expect(paginationSkip(2, 25)).toBe(25);
    expect(paginationSkip(3, 10)).toBe(20);
  });
});

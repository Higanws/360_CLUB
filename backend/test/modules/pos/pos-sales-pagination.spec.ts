import { BadRequestException } from '@nestjs/common';
import { PosSalesService } from '../../../src/pos/pos-sales.service';
import { DashboardCacheService } from '../../../src/shared/cache/dashboard-cache.service';

describe('pos / PosSalesService paginación', () => {
  const dashboardCache = {
    invalidateBusinessMetrics: jest.fn().mockResolvedValue(undefined),
  } as unknown as DashboardCacheService;

  function makeService(rawRows: Array<Record<string, unknown>>, total: number) {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(total),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawRows),
    };
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      }),
    };
    return {
      service: new PosSalesService(dataSource as never, dashboardCache),
      qb,
    };
  }

  it('listSales devuelve sales y meta paginada', async () => {
    const { service } = makeService(
      [
        {
          id: 1,
          total_amount: 10,
          created_at: new Date('2026-01-15T12:00:00.000Z'),
          payment_method: 'efectivo',
          created_by: 1,
          seller_username: 'admin',
        },
      ],
      1,
    );

    const result = await service.listSales('2026-01-01', '2026-01-31', 1, 25);
    expect(result.sales).toHaveLength(1);
    expect(result.sales[0]?.id).toBe(1);
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 25,
      total: 1,
      pageCount: 1,
    });
  });

  it('rechaza rango mayor a 90 días', async () => {
    const { service } = makeService([], 0);
    await expect(
      service.listSales('2026-01-01', '2026-06-01', 1, 25),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

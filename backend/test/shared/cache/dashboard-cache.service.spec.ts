import { DashboardCacheService } from '../../../src/shared/cache/dashboard-cache.service';
import { CACHE_KEYS } from '../../../src/shared/cache/cache-ttl';

describe('shared / DashboardCacheService', () => {
  it('invalida la clave de métricas del dashboard', async () => {
    const del = jest.fn().mockResolvedValue(undefined);
    const cache = { del } as never;
    const svc = new DashboardCacheService(cache);
    await svc.invalidateBusinessMetrics();
    expect(del).toHaveBeenCalledWith(CACHE_KEYS.DASHBOARD_BUSINESS_METRICS);
  });
});

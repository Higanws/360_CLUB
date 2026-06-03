import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_KEYS } from './cache-ttl';

/** Invalida métricas del dashboard tras mutaciones que las afectan. */
@Injectable()
export class DashboardCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async invalidateBusinessMetrics(): Promise<void> {
    await this.cache.del(CACHE_KEYS.DASHBOARD_BUSINESS_METRICS);
  }
}

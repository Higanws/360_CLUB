/** TTL caché in-memory / Redis (ms). */
export const CACHE_TTL = {
  DASHBOARD_METRICS: 120_000,
  CLUB_BRANDING: 300_000,
} as const;

export const CACHE_KEYS = {
  DASHBOARD_BUSINESS_METRICS: 'dashboard:business-metrics',
  CLUB_BRANDING: 'settings:club-branding',
} as const;

import { SetMetadata } from '@nestjs/common';

/** Rutas permitidas mientras la BD está en mantenimiento (backup/restore). */
export const SKIP_DB_MAINTENANCE_KEY = 'skipDbMaintenance';
export const SkipDbMaintenance = () => SetMetadata(SKIP_DB_MAINTENANCE_KEY, true);

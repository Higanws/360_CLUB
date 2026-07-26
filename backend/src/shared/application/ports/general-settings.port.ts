import type { GeneralSetting } from '@prisma/client';

export interface GeneralSettingsRepository {
  getPrimary(): Promise<GeneralSetting | null>;
}

export const GENERAL_SETTINGS = Symbol('GENERAL_SETTINGS');

import type { GeneralSetting } from '../../../entities/general-setting.entity';

export interface GeneralSettingsRepository {
  getPrimary(): Promise<GeneralSetting | null>;
}

export const GENERAL_SETTINGS = Symbol('GENERAL_SETTINGS');

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  GENERAL_SETTINGS,
  type GeneralSettingsRepository,
} from '../ports/general-settings.port';
import type { ClubBrandingDto } from './club-branding.dto';
import { CACHE_KEYS, CACHE_TTL } from '../../cache/cache-ttl';

/** Caso de uso: configuración pública del club (login / kiosk). */
@Injectable()
export class GetClubBrandingUseCase {
  constructor(
    @Inject(GENERAL_SETTINGS)
    private readonly settings: GeneralSettingsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(): Promise<ClubBrandingDto> {
    const cached = await this.cache.get<ClubBrandingDto>(CACHE_KEYS.CLUB_BRANDING);
    if (cached) return cached;

    const row = await this.settings.getPrimary();
    const result: ClubBrandingDto = {
      name: row?.name ?? 'Club360',
      gym_logo: row?.gym_logo ?? null,
      left_header: row?.left_header ?? row?.name ?? 'Club360',
      footer: row?.footer ?? '',
      header_color: row?.header_color ?? '#1db198',
      currency: row?.currency ?? 'ARS',
    };
    await this.cache.set(
      CACHE_KEYS.CLUB_BRANDING,
      result,
      CACHE_TTL.CLUB_BRANDING,
    );
    return result;
  }
}

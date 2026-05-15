import { Inject, Injectable } from '@nestjs/common';
import {
  GENERAL_SETTINGS,
  type GeneralSettingsRepository,
} from '../ports/general-settings.port';
import type { ClubBrandingDto } from './club-branding.dto';

/** Caso de uso: configuración pública del club (login / kiosk). */
@Injectable()
export class GetClubBrandingUseCase {
  constructor(
    @Inject(GENERAL_SETTINGS)
    private readonly settings: GeneralSettingsRepository,
  ) {}

  async execute(): Promise<ClubBrandingDto> {
    const row = await this.settings.getPrimary();
    return {
      name: row?.name ?? 'Club360',
      gym_logo: row?.gym_logo ?? null,
      left_header: row?.left_header ?? row?.name ?? 'Club360',
      footer: row?.footer ?? '',
      header_color: row?.header_color ?? '#1db198',
      currency: row?.currency ?? 'ARS',
    };
  }
}

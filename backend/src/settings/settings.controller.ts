import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';

@Controller('settings')
export class SettingsController {
  constructor(
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
  ) {}

  /** Datos públicos para pantalla de login (nombre club, colores). */
  @Get('branding')
  async branding() {
    const row =
      (await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ??
      null;

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

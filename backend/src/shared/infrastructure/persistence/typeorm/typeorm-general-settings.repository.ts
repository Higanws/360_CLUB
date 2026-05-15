import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { GeneralSettingsRepository } from '../../../application/ports/general-settings.port';
import { GeneralSetting } from '../../../../entities/general-setting.entity';

@Injectable()
export class TypeOrmGeneralSettingsRepository
  implements GeneralSettingsRepository
{
  constructor(
    @InjectRepository(GeneralSetting)
    private readonly settings: Repository<GeneralSetting>,
  ) {}

  async getPrimary(): Promise<GeneralSetting | null> {
    const rows = await this.settings.find({
      take: 1,
      order: { id: 'ASC' },
    });
    return rows[0] ?? null;
  }
}

import { Injectable } from '@nestjs/common';
import type { GeneralSetting } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import type { GeneralSettingsRepository } from '../../../application/ports/general-settings.port';

@Injectable()
export class PrismaGeneralSettingsRepository
  implements GeneralSettingsRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async getPrimary(): Promise<GeneralSetting | null> {
    return this.prisma.generalSetting.findFirst({
      orderBy: { id: 'asc' },
    });
  }
}

import { Global, Module } from '@nestjs/common';
import { GetClubBrandingUseCase } from './application/club/get-club-branding.use-case';
import { DashboardCacheService } from './cache/dashboard-cache.service';
import { GYM_MEMBER_READ } from './application/ports/gym-member-read.port';
import { GENERAL_SETTINGS } from './application/ports/general-settings.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { PrismaGymMemberReadRepository } from './infrastructure/persistence/prisma/prisma-gym-member-read.repository';
import { PrismaGeneralSettingsRepository } from './infrastructure/persistence/prisma/prisma-general-settings.repository';

/**
 * Módulo transversal (hexagonal): puertos + adaptadores Prisma reutilizables.
 * @Global() para inyectar casos de uso en feature modules sin reimportar Prisma.
 */
@Global()
@Module({
  providers: [
    PrismaGymMemberReadRepository,
    PrismaGeneralSettingsRepository,
    BcryptPasswordHasher,
    { provide: GYM_MEMBER_READ, useExisting: PrismaGymMemberReadRepository },
    {
      provide: GENERAL_SETTINGS,
      useExisting: PrismaGeneralSettingsRepository,
    },
    { provide: PASSWORD_HASHER, useExisting: BcryptPasswordHasher },
    GetClubBrandingUseCase,
    DashboardCacheService,
  ],
  exports: [
    GYM_MEMBER_READ,
    GENERAL_SETTINGS,
    PASSWORD_HASHER,
    GetClubBrandingUseCase,
    DashboardCacheService,
    PrismaGymMemberReadRepository,
  ],
})
export class ClubSharedModule {}

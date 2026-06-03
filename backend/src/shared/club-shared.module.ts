import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { GetClubBrandingUseCase } from './application/club/get-club-branding.use-case';
import { DashboardCacheService } from './cache/dashboard-cache.service';
import { GYM_MEMBER_READ } from './application/ports/gym-member-read.port';
import { GENERAL_SETTINGS } from './application/ports/general-settings.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { TypeOrmGymMemberReadRepository } from './infrastructure/persistence/typeorm/typeorm-gym-member-read.repository';
import { TypeOrmGeneralSettingsRepository } from './infrastructure/persistence/typeorm/typeorm-general-settings.repository';

/**
 * Módulo transversal (hexagonal): puertos + adaptadores TypeORM reutilizables.
 * @Global() para inyectar casos de uso en feature modules sin reimportar entidades.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GymMember, GeneralSetting])],
  providers: [
    TypeOrmGymMemberReadRepository,
    TypeOrmGeneralSettingsRepository,
    BcryptPasswordHasher,
    { provide: GYM_MEMBER_READ, useExisting: TypeOrmGymMemberReadRepository },
    {
      provide: GENERAL_SETTINGS,
      useExisting: TypeOrmGeneralSettingsRepository,
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
    TypeOrmGymMemberReadRepository,
  ],
})
export class ClubSharedModule {}

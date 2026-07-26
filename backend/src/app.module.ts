import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { HomeModule } from './home/home.module';
import { MembersModule } from './members/members.module';
import { MembershipPaymentsModule } from './membership-payments/membership-payments.module';
import { MembershipsModule } from './memberships/memberships.module';
import { PosModule } from './pos/pos.module';
import { StaffModule } from './staff/staff.module';
import { ActivitiesModule } from './activities/activities.module';
import { TrainingModule } from './training/training.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { MemberWellnessModule } from './member-wellness/member-wellness.module';
import { AccessControlModule } from './access-control/access-control.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InstallModule } from './install/install.module';
import { isInstallComplete } from './install/install-state';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { SettingsModule } from './settings/settings.module';
import { DatabaseModule } from './database/database.module';
import { ClubSharedModule } from './shared/club-shared.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

const dbStack = isInstallComplete()
  ? [
      DatabaseModule,
      ClubSharedModule,
      HealthModule,
      AuthModule,
      SettingsModule,
      HomeModule,
      MembersModule,
      StaffModule,
      MembershipPaymentsModule,
      MembershipsModule,
      PosModule,
      ActivitiesModule,
      TrainingModule,
      NutritionModule,
      MemberWellnessModule,
      AccessControlModule,
      DashboardModule,
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'backend', '.env'),
        join(__dirname, '..', '.env'),
      ],
    }),
    IdempotencyModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL')?.trim();
        if (redisUrl) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            return {
              store: await redisStore({ url: redisUrl }),
              ttl: 60_000,
              max: 500,
            };
          } catch (err) {
            console.warn(
              '[cache] Redis no disponible; fallback in-memory:',
              err instanceof Error ? err.message : err,
            );
          }
        }
        return { ttl: 60_000, max: 500 };
      },
    }),
    InstallModule,
    ...dbStack,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

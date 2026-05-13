import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { createMysqlTypeOrmOptions } from './infrastructure/persistence/mysql-typeorm.factory';

const dbStack = isInstallComplete()
  ? [
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: createMysqlTypeOrmOptions,
      }),
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
    InstallModule,
    ...dbStack,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

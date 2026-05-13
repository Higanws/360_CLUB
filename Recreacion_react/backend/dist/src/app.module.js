"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const health_module_1 = require("./health/health.module");
const home_module_1 = require("./home/home.module");
const members_module_1 = require("./members/members.module");
const membership_payments_module_1 = require("./membership-payments/membership-payments.module");
const memberships_module_1 = require("./memberships/memberships.module");
const pos_module_1 = require("./pos/pos.module");
const staff_module_1 = require("./staff/staff.module");
const activities_module_1 = require("./activities/activities.module");
const training_module_1 = require("./training/training.module");
const nutrition_module_1 = require("./nutrition/nutrition.module");
const member_wellness_module_1 = require("./member-wellness/member-wellness.module");
const access_control_module_1 = require("./access-control/access-control.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const install_module_1 = require("./install/install.module");
const install_state_1 = require("./install/install-state");
const idempotency_module_1 = require("./idempotency/idempotency.module");
const settings_module_1 = require("./settings/settings.module");
const mysql_typeorm_factory_1 = require("./infrastructure/persistence/mysql-typeorm.factory");
const dbStack = (0, install_state_1.isInstallComplete)()
    ? [
        typeorm_1.TypeOrmModule.forRootAsync({
            imports: [config_1.ConfigModule],
            inject: [config_1.ConfigService],
            useFactory: mysql_typeorm_factory_1.createMysqlTypeOrmOptions,
        }),
        health_module_1.HealthModule,
        auth_module_1.AuthModule,
        settings_module_1.SettingsModule,
        home_module_1.HomeModule,
        members_module_1.MembersModule,
        staff_module_1.StaffModule,
        membership_payments_module_1.MembershipPaymentsModule,
        memberships_module_1.MembershipsModule,
        pos_module_1.PosModule,
        activities_module_1.ActivitiesModule,
        training_module_1.TrainingModule,
        nutrition_module_1.NutritionModule,
        member_wellness_module_1.MemberWellnessModule,
        access_control_module_1.AccessControlModule,
        dashboard_module_1.DashboardModule,
    ]
    : [];
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(process.cwd(), '.env'),
                    (0, path_1.join)(process.cwd(), 'backend', '.env'),
                    (0, path_1.join)(__dirname, '..', '.env'),
                ],
            }),
            idempotency_module_1.IdempotencyModule,
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 120,
                },
            ]),
            install_module_1.InstallModule,
            ...dbStack,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
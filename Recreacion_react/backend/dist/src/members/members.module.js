"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const class_schedule_entity_1 = require("../entities/class-schedule.entity");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_class_entity_1 = require("../entities/gym-member-class.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const membership_entity_1 = require("../entities/membership.entity");
const business_role_guard_1 = require("./business-role.guard");
const members_controller_1 = require("./members.controller");
const members_service_1 = require("./members.service");
let MembersModule = class MembersModule {
};
exports.MembersModule = MembersModule;
exports.MembersModule = MembersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                gym_member_entity_1.GymMember,
                general_setting_entity_1.GeneralSetting,
                gym_member_class_entity_1.GymMemberClass,
                membership_entity_1.Membership,
                membership_payment_entity_1.MembershipPayment,
                class_schedule_entity_1.ClassSchedule,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [members_controller_1.MembersController],
        providers: [members_service_1.MembersService, business_role_guard_1.BusinessRoleGuard],
    })
], MembersModule);
//# sourceMappingURL=members.module.js.map
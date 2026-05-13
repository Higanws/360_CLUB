"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const membership_entity_1 = require("../entities/membership.entity");
const membership_payments_controller_1 = require("./membership-payments.controller");
const membership_payments_service_1 = require("./membership-payments.service");
let MembershipPaymentsModule = class MembershipPaymentsModule {
};
exports.MembershipPaymentsModule = MembershipPaymentsModule;
exports.MembershipPaymentsModule = MembershipPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                membership_payment_entity_1.MembershipPayment,
                gym_member_entity_1.GymMember,
                membership_entity_1.Membership,
                general_setting_entity_1.GeneralSetting,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [membership_payments_controller_1.MembershipPaymentsController],
        providers: [membership_payments_service_1.MembershipPaymentsService],
    })
], MembershipPaymentsModule);
//# sourceMappingURL=membership-payments.module.js.map
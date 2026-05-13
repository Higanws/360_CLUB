"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const club_access_log_entity_1 = require("../entities/club-access-log.entity");
const general_setting_entity_1 = require("../entities/general-setting.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const access_control_controller_1 = require("./access-control.controller");
const access_control_service_1 = require("./access-control.service");
let AccessControlModule = class AccessControlModule {
};
exports.AccessControlModule = AccessControlModule;
exports.AccessControlModule = AccessControlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                general_setting_entity_1.GeneralSetting,
                gym_member_entity_1.GymMember,
                membership_payment_entity_1.MembershipPayment,
                club_access_log_entity_1.ClubAccessLog,
            ]),
        ],
        controllers: [access_control_controller_1.AccessControlController],
        providers: [access_control_service_1.AccessControlService],
    })
], AccessControlModule);
//# sourceMappingURL=access-control.module.js.map
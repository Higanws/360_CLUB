"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const membership_entity_1 = require("../entities/membership.entity");
const membership_payment_entity_1 = require("../entities/membership-payment.entity");
const memberships_controller_1 = require("./memberships.controller");
const memberships_service_1 = require("./memberships.service");
let MembershipsModule = class MembershipsModule {
};
exports.MembershipsModule = MembershipsModule;
exports.MembershipsModule = MembershipsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([membership_entity_1.Membership, membership_payment_entity_1.MembershipPayment])],
        controllers: [memberships_controller_1.MembershipsController],
        providers: [memberships_service_1.MembershipsService],
    })
], MembershipsModule);
//# sourceMappingURL=memberships.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const gym_role_entity_1 = require("../entities/gym-role.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const specialization_entity_1 = require("../entities/specialization.entity");
const administrator_role_guard_1 = require("./administrator-role.guard");
const staff_controller_1 = require("./staff.controller");
const staff_service_1 = require("./staff.service");
let StaffModule = class StaffModule {
};
exports.StaffModule = StaffModule;
exports.StaffModule = StaffModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([gym_member_entity_1.GymMember, gym_role_entity_1.GymRole, specialization_entity_1.Specialization]),
            auth_module_1.AuthModule,
        ],
        controllers: [staff_controller_1.StaffController],
        providers: [staff_service_1.StaffService, administrator_role_guard_1.AdministratorRoleGuard],
    })
], StaffModule);
//# sourceMappingURL=staff.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const general_setting_entity_1 = require("../entities/general-setting.entity");
let SettingsController = class SettingsController {
    constructor(settings) {
        this.settings = settings;
    }
    async branding() {
        const row = (await this.settings.find({ take: 1, order: { id: 'ASC' } }))[0] ??
            null;
        return {
            name: row?.name ?? 'Club360',
            gym_logo: row?.gym_logo ?? null,
            left_header: row?.left_header ?? row?.name ?? 'Club360',
            footer: row?.footer ?? '',
            header_color: row?.header_color ?? '#1db198',
            currency: row?.currency ?? 'EUR',
        };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('branding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "branding", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    __param(0, (0, typeorm_1.InjectRepository)(general_setting_entity_1.GeneralSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map
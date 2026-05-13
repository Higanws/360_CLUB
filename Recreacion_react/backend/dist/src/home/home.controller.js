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
exports.HomeController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let HomeController = class HomeController {
    summary(req) {
        const role = (req.user.role_name ?? '').trim().toLowerCase();
        if (role === 'administrator') {
            return {
                role: 'administrator',
                title: 'Panel de administración',
                subtitle: 'Resumen del club (miembros, staff y finanzas) — próximas fases.',
            };
        }
        if (role === 'member') {
            return {
                role: 'member',
                title: 'Tu zona de socio',
                subtitle: 'Aquí verás rutinas de entreno y dieta asignadas por tu club.',
            };
        }
        return {
            role: 'staff',
            title: 'Panel de staff',
            subtitle: 'Herramientas para entrenadores y personal interno — próximas fases.',
            raw_role: req.user.role_name,
        };
    }
};
exports.HomeController = HomeController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HomeController.prototype, "summary", null);
exports.HomeController = HomeController = __decorate([
    (0, common_1.Controller)('home'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'))
], HomeController);
//# sourceMappingURL=home.controller.js.map
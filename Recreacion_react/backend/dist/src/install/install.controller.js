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
exports.InstallController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const install_dto_1 = require("./dto/install.dto");
const install_state_1 = require("./install-state");
const install_service_1 = require("./install.service");
let InstallController = class InstallController {
    constructor(install) {
        this.install = install;
    }
    status() {
        return { installed: (0, install_state_1.isInstallComplete)() };
    }
    dbCheck() {
        return this.install.pingProjectDefaults();
    }
    async testDb(dto) {
        if ((0, install_state_1.isInstallComplete)()) {
            throw new common_1.ConflictException('La instalación ya está completada.');
        }
        return this.install.testConnection(dto);
    }
    async run(dto) {
        if ((0, install_state_1.isInstallComplete)()) {
            throw new common_1.ConflictException('La instalación ya está completada.');
        }
        return this.install.run(dto);
    }
    async runStream(dto, res) {
        if ((0, install_state_1.isInstallComplete)()) {
            res.status(409).json({
                message: 'La instalación ya está completada.',
            });
            return;
        }
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();
        const send = (payload) => {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        };
        try {
            const result = await this.install.run(dto, (ev) => send(ev));
            send({
                step: 'done',
                success: true,
                message: result.message,
                adminUsername: result.adminUsername,
            });
        }
        catch (e) {
            const status = e instanceof common_1.HttpException ? e.getStatus() : 500;
            const body = e instanceof common_1.HttpException ? e.getResponse() : null;
            const message = typeof body === 'string'
                ? body
                : body && typeof body === 'object' && 'message' in body
                    ? String(body.message)
                    : e instanceof Error
                        ? e.message
                        : String(e);
            send({ step: 'error', status, message });
        }
        finally {
            res.end();
        }
    }
};
exports.InstallController = InstallController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstallController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('db-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstallController.prototype, "dbCheck", null);
__decorate([
    (0, common_1.Post)('test-db'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [install_dto_1.TestDbDto]),
    __metadata("design:returntype", Promise)
], InstallController.prototype, "testDb", null);
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [install_dto_1.RunInstallDto]),
    __metadata("design:returntype", Promise)
], InstallController.prototype, "run", null);
__decorate([
    (0, common_1.Post)('run-stream'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [install_dto_1.RunInstallDto, Object]),
    __metadata("design:returntype", Promise)
], InstallController.prototype, "runStream", null);
exports.InstallController = InstallController = __decorate([
    (0, common_1.Controller)('install'),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [install_service_1.InstallService])
], InstallController);
//# sourceMappingURL=install.controller.js.map
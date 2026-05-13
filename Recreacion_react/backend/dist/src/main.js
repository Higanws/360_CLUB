"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const install_state_1 = require("./install/install-state");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Idempotency-Key',
            'idempotency-key',
        ],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port);
    if (!(0, install_state_1.isInstallComplete)()) {
        console.log(`[Club360] Modo asistente activo → http://localhost:${port}/api/install/status (sin TypeORM ni MySQL hasta completar el wizard).`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map
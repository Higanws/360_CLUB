"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const gym_member_entity_1 = require("../entities/gym-member.entity");
let AuthService = AuthService_1 = class AuthService {
    constructor(members, jwt, config) {
        this.members = members;
        this.jwt = jwt;
        this.config = config;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    sanitize(member) {
        const { password: _p, ...rest } = member;
        return rest;
    }
    assertMemberMayLogin(member) {
        const role = (member.role_name ?? '').trim().toLowerCase();
        if (role !== 'member') {
            return;
        }
        if (member.activated !== 1) {
            throw new common_1.ForbiddenException('Tu cuenta aún no está activada. Contacta con recepción.');
        }
        const status = (member.membership_status ?? '').trim();
        if (status.toLowerCase() === 'expired') {
            throw new common_1.ForbiddenException('Tu cuenta de socio está caducada. Renueva en recepción.');
        }
        const expiry = member.membership_valid_to;
        if (expiry) {
            const today = this.todayUtcDateString();
            const exp = expiry instanceof Date
                ? expiry.toISOString().slice(0, 10)
                : String(expiry).slice(0, 10);
            if (today > exp) {
                throw new common_1.ForbiddenException('Tu cuenta de socio está caducada. Renueva en recepción.');
            }
        }
    }
    parseJwtTtlSeconds(raw, fallback, min) {
        const n = parseInt(raw ?? String(fallback), 10);
        if (!Number.isFinite(n) || n < min) {
            return fallback;
        }
        return n;
    }
    todayUtcDateString() {
        const d = new Date();
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    async validateCredentials(dto) {
        const username = dto.username.trim();
        const member = await this.members.findOne({
            where: { username },
        });
        if (!member?.password) {
            throw new common_1.UnauthorizedException('Usuario o contraseña incorrectos.');
        }
        let ok = false;
        try {
            ok = await bcrypt.compare(dto.password, member.password);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`bcrypt.compare falló (hash corrupto o no bcrypt): ${msg}`);
            throw new common_1.UnauthorizedException('Usuario o contraseña incorrectos.');
        }
        if (!ok) {
            throw new common_1.UnauthorizedException('Usuario o contraseña incorrectos.');
        }
        this.assertMemberMayLogin(member);
        return member;
    }
    async login(dto) {
        const member = await this.validateCredentials(dto);
        const tokens = await this.issueTokens(member);
        return {
            ...tokens,
            user: this.sanitize(member),
        };
    }
    async issueTokens(member) {
        const role_name = (member.role_name ?? '').trim();
        const payloadBase = {
            sub: member.id,
            username: member.username ?? '',
            role_name,
        };
        const accessSec = this.parseJwtTtlSeconds(this.config.get('JWT_ACCESS_SECONDS'), 1800, 60);
        const refreshSec = this.parseJwtTtlSeconds(this.config.get('JWT_REFRESH_SECONDS'), 604800, 300);
        let accessToken;
        let refreshToken;
        try {
            [accessToken, refreshToken] = await Promise.all([
                this.jwt.signAsync({ ...payloadBase, kind: 'access' }, { expiresIn: accessSec }),
                this.jwt.signAsync({ ...payloadBase, kind: 'refresh' }, { expiresIn: refreshSec }),
            ]);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`JWT signAsync falló: ${msg}`);
            throw new common_1.InternalServerErrorException('No se pudo crear la sesión: revisa JWT_SECRET y JWT_ACCESS_SECONDS / JWT_REFRESH_SECONDS en backend/.env.');
        }
        return { accessToken, refreshToken };
    }
    async refresh(refreshToken) {
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(refreshToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Sesión inválida o expirada.');
        }
        if (decoded.kind !== 'refresh') {
            throw new common_1.UnauthorizedException('Token incorrecto.');
        }
        const member = await this.members.findOne({
            where: { id: decoded.sub },
        });
        if (!member) {
            throw new common_1.UnauthorizedException('Usuario no encontrado.');
        }
        this.assertMemberMayLogin(member);
        return this.issueTokens(member);
    }
    async getProfile(userId) {
        const member = await this.members.findOne({ where: { id: userId } });
        if (!member) {
            throw new common_1.UnauthorizedException();
        }
        return this.sanitize(member);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
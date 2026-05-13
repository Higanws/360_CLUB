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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const gym_role_entity_1 = require("../entities/gym-role.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const specialization_entity_1 = require("../entities/specialization.entity");
function isoDateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString().slice(0, 10);
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
}
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
let StaffService = class StaffService {
    constructor(members, gymRoles, specializations) {
        this.members = members;
        this.gymRoles = gymRoles;
        this.specializations = specializations;
    }
    encodeSpecialization(ids) {
        return JSON.stringify(ids.map((id) => String(id)));
    }
    decodeSpecialization(json) {
        if (!json)
            return [];
        try {
            const arr = JSON.parse(json);
            if (!Array.isArray(arr))
                return [];
            return arr
                .map((x) => parseInt(String(x), 10))
                .filter((n) => !Number.isNaN(n) && n > 0);
        }
        catch {
            return [];
        }
    }
    async formOptions() {
        const roles = await this.gymRoles.find({ order: { name: 'ASC' } });
        const specs = await this.specializations.find({ order: { name: 'ASC' } });
        return {
            club_roles: roles.map((r) => ({ id: r.id, name: r.name })),
            specializations: specs.map((s) => ({ id: s.id, name: s.name })),
        };
    }
    async listForUser(actor) {
        const ar = normRole(actor.role_name);
        if (ar !== 'administrator' && ar !== 'staff_member') {
            throw new common_1.ForbiddenException('Sin acceso al listado de personal.');
        }
        const qb = this.members
            .createQueryBuilder('m')
            .select([
            'm.id',
            'm.first_name',
            'm.last_name',
            'm.image',
            'm.email',
            'm.mobile',
            'm.role',
        ])
            .where('LOWER(TRIM(m.role_name)) = :sn', { sn: 'staff_member' })
            .orderBy('m.first_name', 'ASC')
            .addOrderBy('m.last_name', 'ASC');
        if (ar === 'staff_member') {
            qb.andWhere('m.id = :uid', { uid: actor.userId });
        }
        const entities = await qb.getMany();
        const roleIds = [
            ...new Set(entities.map((m) => m.role).filter((x) => x != null)),
        ];
        const roleRows = roleIds.length > 0
            ? await this.gymRoles.findBy({ id: (0, typeorm_2.In)(roleIds) })
            : [];
        const roleNames = new Map(roleRows.map((r) => [r.id, r.name]));
        const staff = entities.map((m) => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            image: m.image,
            email: m.email,
            mobile: m.mobile,
            club_role_name: m.role != null ? roleNames.get(m.role) ?? null : null,
        }));
        return {
            staff,
            meta: {
                can_manage: ar === 'administrator',
                is_administrator: ar === 'administrator',
            },
        };
    }
    async assertCanViewStaff(actor, staffId) {
        const ar = normRole(actor.role_name);
        if (ar === 'administrator')
            return;
        if (ar === 'staff_member' && actor.userId === staffId)
            return;
        throw new common_1.ForbiddenException('No puedes ver la ficha de otro usuario.');
    }
    async findOne(id, actor) {
        await this.assertCanViewStaff(actor, id);
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'staff_member') {
            throw new common_1.NotFoundException('Miembro del personal no encontrado.');
        }
        let club_role_name = null;
        if (m.role != null) {
            const gr = await this.gymRoles.findOne({ where: { id: m.role } });
            club_role_name = gr?.name ?? null;
        }
        const specialization_ids = this.decodeSpecialization(m.s_specialization);
        let specialization_labels = [];
        if (specialization_ids.length) {
            const specs = await this.specializations.find({
                where: { id: (0, typeorm_2.In)(specialization_ids) },
            });
            const map = new Map(specs.map((s) => [s.id, s.name ?? '']));
            specialization_labels = specialization_ids
                .map((i) => map.get(i))
                .filter((x) => x != null);
        }
        return {
            staff: {
                id: m.id,
                first_name: m.first_name,
                middle_name: m.middle_name,
                last_name: m.last_name,
                gender: m.gender,
                birth_date: isoDateOnly(m.birth_date),
                role: m.role,
                club_role_name,
                specialization_ids,
                specialization_labels,
                address: m.address,
                city: m.city,
                state: m.state,
                zipcode: m.zipcode,
                mobile: m.mobile,
                phone: m.phone,
                email: m.email,
                username: m.username,
                image: m.image,
                activated: m.activated,
            },
        };
    }
    async create(dto) {
        await this.assertUsernameAvailable(dto.username);
        const roleRow = await this.gymRoles.findOne({ where: { id: dto.role } });
        if (!roleRow) {
            throw new common_1.BadRequestException('El rol de club indicado no existe.');
        }
        for (const sid of dto.specialization_ids) {
            const ex = await this.specializations.findOne({ where: { id: sid } });
            if (!ex) {
                throw new common_1.BadRequestException(`Especialización inválida: ${sid}`);
            }
        }
        const hash = await bcrypt.hash(dto.password, 10);
        const row = this.members.create({
            role_name: 'staff_member',
            activated: 1,
            first_name: dto.first_name.trim(),
            middle_name: dto.middle_name?.trim() || null,
            last_name: dto.last_name.trim(),
            gender: dto.gender,
            birth_date: new Date(dto.birth_date),
            role: dto.role,
            s_specialization: this.encodeSpecialization(dto.specialization_ids),
            address: dto.address.trim(),
            city: dto.city.trim(),
            state: dto.state?.trim() || null,
            zipcode: dto.zipcode?.trim() || null,
            mobile: dto.mobile.trim(),
            phone: dto.phone?.trim() || null,
            email: dto.email.trim(),
            username: dto.username.trim(),
            password: hash,
            image: 'Thumbnail-img.png',
            member_id: '',
            created_date: new Date(),
        });
        const saved = await this.members.save(row);
        return this.findOne(saved.id, {
            userId: saved.id,
            role_name: 'staff_member',
        });
    }
    async update(id, dto, actor) {
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'staff_member') {
            throw new common_1.NotFoundException('Miembro del personal no encontrado.');
        }
        if (dto.role !== undefined) {
            const roleRow = await this.gymRoles.findOne({ where: { id: dto.role } });
            if (!roleRow) {
                throw new common_1.BadRequestException('El rol de club indicado no existe.');
            }
            m.role = dto.role;
        }
        if (dto.specialization_ids !== undefined) {
            for (const sid of dto.specialization_ids) {
                const ex = await this.specializations.findOne({ where: { id: sid } });
                if (!ex) {
                    throw new common_1.BadRequestException(`Especialización inválida: ${sid}`);
                }
            }
            m.s_specialization = this.encodeSpecialization(dto.specialization_ids);
        }
        if (dto.password !== undefined && dto.password.length > 0) {
            m.password = await bcrypt.hash(dto.password, 10);
        }
        if (dto.first_name !== undefined)
            m.first_name = dto.first_name.trim();
        if (dto.middle_name !== undefined)
            m.middle_name = dto.middle_name?.trim() || null;
        if (dto.last_name !== undefined)
            m.last_name = dto.last_name.trim();
        if (dto.gender !== undefined)
            m.gender = dto.gender;
        if (dto.birth_date !== undefined)
            m.birth_date = new Date(dto.birth_date);
        if (dto.address !== undefined)
            m.address = dto.address.trim();
        if (dto.city !== undefined)
            m.city = dto.city.trim();
        if (dto.state !== undefined)
            m.state = dto.state?.trim() || null;
        if (dto.zipcode !== undefined)
            m.zipcode = dto.zipcode?.trim() || null;
        if (dto.mobile !== undefined)
            m.mobile = dto.mobile.trim();
        if (dto.phone !== undefined)
            m.phone = dto.phone?.trim() || null;
        if (dto.email !== undefined)
            m.email = dto.email.trim();
        await this.members.save(m);
        return this.findOne(id, actor);
    }
    async remove(id) {
        const m = await this.members.findOne({ where: { id } });
        if (!m || normRole(m.role_name) !== 'staff_member') {
            throw new common_1.NotFoundException('Miembro del personal no encontrado.');
        }
        await this.members.delete({ id });
        return { ok: true };
    }
    async assertUsernameAvailable(username, excludeId) {
        const q = this.members
            .createQueryBuilder('m')
            .where('LOWER(TRIM(m.username)) = LOWER(TRIM(:u))', {
            u: username.trim(),
        });
        if (excludeId != null)
            q.andWhere('m.id != :id', { id: excludeId });
        if ((await q.getCount()) > 0) {
            throw new common_1.ConflictException('Ya existe un usuario con ese nombre de acceso.');
        }
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __param(1, (0, typeorm_1.InjectRepository)(gym_role_entity_1.GymRole)),
    __param(2, (0, typeorm_1.InjectRepository)(specialization_entity_1.Specialization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StaffService);
//# sourceMappingURL=staff.service.js.map
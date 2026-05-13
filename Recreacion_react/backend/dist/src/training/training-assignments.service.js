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
exports.TrainingAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const training_assignment_entity_1 = require("../entities/training-assignment.entity");
const training_assignment_member_entity_1 = require("../entities/training-assignment-member.entity");
const training_assignment_trainer_entity_1 = require("../entities/training-assignment-trainer.entity");
const training_routine_entity_1 = require("../entities/training-routine.entity");
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
function memberDisplayName(m) {
    if (!m)
        return '—';
    const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
    if (parts)
        return parts;
    return m.username ?? `ID ${m.id}`;
}
let TrainingAssignmentsService = class TrainingAssignmentsService {
    constructor(assignments, assignmentMembers, assignmentTrainers, routines, members) {
        this.assignments = assignments;
        this.assignmentMembers = assignmentMembers;
        this.assignmentTrainers = assignmentTrainers;
        this.routines = routines;
        this.members = members;
    }
    async list() {
        const rows = await this.assignments.find({
            relations: [
                'routine',
                'members',
                'members.member',
                'trainers',
                'trainers.trainer',
            ],
            order: { id: 'DESC' },
        });
        return rows.map((a) => ({
            id: a.id,
            routine_id: a.routine_id,
            routine_title: a.routine?.title ?? '',
            member_ids: (a.members ?? []).map((m) => m.member_id),
            member_names: (a.members ?? []).map((m) => memberDisplayName(m.member)),
            trainer_names: (a.trainers ?? []).map((t) => memberDisplayName(t.trainer)),
            created_at: a.created_at instanceof Date
                ? a.created_at.toISOString()
                : String(a.created_at),
        }));
    }
    async getOne(id) {
        const a = await this.assignments.findOne({
            where: { id },
            relations: [
                'routine',
                'members',
                'members.member',
                'trainers',
                'trainers.trainer',
            ],
        });
        if (!a)
            throw new common_1.NotFoundException('Asignación no encontrada.');
        return {
            id: a.id,
            routine_id: a.routine_id,
            routine_title: a.routine?.title ?? '',
            member_ids: (a.members ?? []).map((m) => m.member_id),
            trainer_member_ids: (a.trainers ?? []).map((t) => t.trainer_member_id),
            members: (a.members ?? []).map((m) => ({
                member_id: m.member_id,
                first_name: m.member?.first_name ?? null,
                last_name: m.member?.last_name ?? null,
                username: m.member?.username ?? null,
            })),
            trainers: (a.trainers ?? []).map((t) => ({
                trainer_member_id: t.trainer_member_id,
                first_name: t.trainer?.first_name ?? null,
                last_name: t.trainer?.last_name ?? null,
                username: t.trainer?.username ?? null,
            })),
            created_at: a.created_at instanceof Date
                ? a.created_at.toISOString()
                : String(a.created_at),
        };
    }
    async create(dto, actor) {
        const routine = await this.routines.findOne({ where: { id: dto.routine_id } });
        if (!routine)
            throw new common_1.BadRequestException('Rutina no encontrada.');
        const memberIds = [...new Set(dto.member_ids)];
        const trainerIds = [...new Set(dto.trainer_member_ids)];
        await this.assertMembers(memberIds, actor);
        await this.assertTrainers(trainerIds, actor);
        const row = this.assignments.create({
            routine: { id: dto.routine_id },
        });
        const saved = await this.assignments.save(row);
        await this.assignmentMembers.save(memberIds.map((member_id) => this.assignmentMembers.create({
            assignment_id: saved.id,
            member_id,
        })));
        await this.assignmentTrainers.save(trainerIds.map((trainer_member_id) => this.assignmentTrainers.create({
            assignment_id: saved.id,
            trainer_member_id,
        })));
        return this.getOne(saved.id);
    }
    async remove(id) {
        const res = await this.assignments.delete({ id });
        if (!res.affected)
            throw new common_1.NotFoundException('Asignación no encontrada.');
    }
    async assertMembers(ids, actor) {
        const rows = await this.members.findBy({ id: (0, typeorm_2.In)(ids) });
        if (rows.length !== ids.length) {
            throw new common_1.BadRequestException('Algún socio no existe.');
        }
        for (const m of rows) {
            if (normRole(m.role_name) !== 'member') {
                throw new common_1.BadRequestException(`El usuario ${m.id} no es un socio.`);
            }
        }
        const ar = normRole(actor.role_name);
        if (ar === 'staff_member') {
            for (const m of rows) {
                if (m.assign_staff_mem !== actor.userId) {
                    throw new common_1.ForbiddenException('Solo puedes asignar rutinas a socios que te están asignados.');
                }
            }
        }
    }
    async assertTrainers(ids, actor) {
        const ar = normRole(actor.role_name);
        if (ar === 'staff_member') {
            for (const id of ids) {
                if (id !== actor.userId) {
                    throw new common_1.ForbiddenException('Solo puedes incluirte a ti mismo como entrenador en la asignación.');
                }
            }
        }
        const rows = await this.members.findBy({ id: (0, typeorm_2.In)(ids) });
        if (rows.length !== ids.length) {
            throw new common_1.BadRequestException('Algún entrenador no existe.');
        }
        for (const m of rows) {
            if (normRole(m.role_name) !== 'staff_member') {
                throw new common_1.BadRequestException(`El usuario ${m.id} no es miembro del personal entrenador.`);
            }
        }
    }
};
exports.TrainingAssignmentsService = TrainingAssignmentsService;
exports.TrainingAssignmentsService = TrainingAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(training_assignment_entity_1.TrainingAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(training_assignment_member_entity_1.TrainingAssignmentMember)),
    __param(2, (0, typeorm_1.InjectRepository)(training_assignment_trainer_entity_1.TrainingAssignmentTrainer)),
    __param(3, (0, typeorm_1.InjectRepository)(training_routine_entity_1.TrainingRoutine)),
    __param(4, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TrainingAssignmentsService);
//# sourceMappingURL=training-assignments.service.js.map
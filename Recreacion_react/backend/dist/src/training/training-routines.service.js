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
exports.TrainingRoutinesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_entity_1 = require("../entities/activity.entity");
const training_routine_entity_1 = require("../entities/training-routine.entity");
const training_routine_activity_entity_1 = require("../entities/training-routine-activity.entity");
const activity_difficulty_1 = require("../activities/activity-difficulty");
const routine_difficulty_1 = require("./routine-difficulty");
let TrainingRoutinesService = class TrainingRoutinesService {
    constructor(routines, lines, activities) {
        this.routines = routines;
        this.lines = lines;
        this.activities = activities;
    }
    async list() {
        const rows = await this.routines.find({
            relations: ['lines'],
            order: { id: 'DESC' },
        });
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            difficulty_level: (0, routine_difficulty_1.normalizeRoutineDifficulty)(r.difficulty_level),
            exercise_count: r.lines?.length ?? 0,
            created_at: r.created_at instanceof Date
                ? r.created_at.toISOString()
                : String(r.created_at),
        }));
    }
    async getOne(id) {
        const r = await this.routines.findOne({
            where: { id },
            relations: ['lines', 'lines.activity', 'lines.activity.category'],
        });
        if (!r)
            throw new common_1.NotFoundException('Rutina no encontrada.');
        const ordered = [...(r.lines ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        return {
            id: r.id,
            title: r.title,
            description: r.description,
            difficulty_level: (0, routine_difficulty_1.normalizeRoutineDifficulty)(r.difficulty_level),
            created_at: r.created_at instanceof Date
                ? r.created_at.toISOString()
                : String(r.created_at),
            activity_ids: ordered.map((l) => l.activity_id),
            exercises: ordered.map((l) => ({
                activity_id: l.activity_id,
                weight_kg: l.weight_kg !== null && l.weight_kg !== undefined
                    ? Number(l.weight_kg)
                    : null,
                weekdays_mask: l.weekdays_mask !== null && l.weekdays_mask !== undefined
                    ? Number(l.weekdays_mask) & 127
                    : 127,
                title: l.activity?.title ?? '',
                difficulty_level: (0, activity_difficulty_1.normalizeActivityDifficulty)(l.activity?.difficulty_level),
                category_name: l.activity?.category?.name ?? '',
            })),
        };
    }
    async create(dto) {
        const normalized = this.normalizeLines(dto.lines);
        const orderedIds = normalized.map((row) => row.activity_id);
        const difficulty = await this.computeDifficultyForOrderedIds(orderedIds);
        const row = this.routines.create({
            title: dto.title.trim(),
            description: dto.description?.trim() || null,
            difficulty_level: difficulty,
        });
        const saved = await this.routines.save(row);
        await this.replaceLines(saved.id, normalized);
        return this.getOne(saved.id);
    }
    async update(id, dto) {
        const r = await this.routines.findOne({ where: { id } });
        if (!r)
            throw new common_1.NotFoundException('Rutina no encontrada.');
        if (dto.title !== undefined) {
            const t = dto.title.trim();
            if (!t)
                throw new common_1.BadRequestException('El título no puede quedar vacío.');
            r.title = t;
        }
        if (dto.description !== undefined) {
            r.description =
                dto.description === null || dto.description === ''
                    ? null
                    : dto.description.trim() || null;
        }
        if (dto.lines !== undefined) {
            const normalized = this.normalizeLines(dto.lines);
            const orderedIds = normalized.map((row) => row.activity_id);
            r.difficulty_level =
                await this.computeDifficultyForOrderedIds(orderedIds);
            await this.replaceLines(id, normalized);
        }
        await this.routines.save(r);
        return this.getOne(id);
    }
    async remove(id) {
        const res = await this.routines.delete({ id });
        if (!res.affected)
            throw new common_1.NotFoundException('Rutina no encontrada.');
    }
    normalizeLines(lines) {
        const seen = new Set();
        const out = [];
        for (const row of lines) {
            const id = Number(row.activity_id);
            if (!Number.isFinite(id) || id < 1)
                continue;
            if (seen.has(id))
                continue;
            seen.add(id);
            const w = row.weight_kg;
            let weight_kg = null;
            if (w !== undefined && w !== null && Number.isFinite(Number(w))) {
                const n = Number(w);
                if (n >= 0)
                    weight_kg = Math.round(n * 100) / 100;
            }
            let weekdays_mask = 127;
            const wm = row.weekdays_mask;
            if (wm !== undefined && wm !== null && Number.isFinite(Number(wm))) {
                weekdays_mask = Number(wm) & 127;
            }
            if (weekdays_mask < 1) {
                throw new common_1.BadRequestException('Cada ejercicio debe tener al menos un día de la semana seleccionado.');
            }
            out.push({ activity_id: id, weight_kg, weekdays_mask });
        }
        if (out.length === 0) {
            throw new common_1.BadRequestException('Añade al menos un ejercicio válido.');
        }
        return out;
    }
    async computeDifficultyForOrderedIds(orderedActivityIds) {
        const acts = await this.activities.findBy({
            id: (0, typeorm_2.In)(orderedActivityIds),
        });
        if (acts.length !== orderedActivityIds.length) {
            throw new common_1.BadRequestException('Alguna actividad no existe.');
        }
        const byId = new Map(acts.map((a) => [a.id, a]));
        const levels = orderedActivityIds.map((aid) => (0, activity_difficulty_1.normalizeActivityDifficulty)(byId.get(aid)?.difficulty_level));
        return (0, routine_difficulty_1.computeRoutineDifficulty)(levels);
    }
    async replaceLines(routineId, rows) {
        await this.lines
            .createQueryBuilder()
            .delete()
            .from(training_routine_activity_entity_1.TrainingRoutineActivity)
            .where('routine_id = :id', { id: routineId })
            .execute();
        await this.lines.save(rows.map((row, sort_order) => this.lines.create({
            routine_id: routineId,
            activity_id: row.activity_id,
            sort_order,
            weight_kg: row.weight_kg,
            weekdays_mask: row.weekdays_mask,
        })));
    }
};
exports.TrainingRoutinesService = TrainingRoutinesService;
exports.TrainingRoutinesService = TrainingRoutinesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(training_routine_entity_1.TrainingRoutine)),
    __param(1, (0, typeorm_1.InjectRepository)(training_routine_activity_entity_1.TrainingRoutineActivity)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TrainingRoutinesService);
//# sourceMappingURL=training-routines.service.js.map
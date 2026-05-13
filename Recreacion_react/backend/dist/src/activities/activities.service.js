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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_entity_1 = require("../entities/activity.entity");
const activity_category_entity_1 = require("../entities/activity-category.entity");
const activity_trainer_entity_1 = require("../entities/activity-trainer.entity");
const activity_video_entity_1 = require("../entities/activity-video.entity");
const gym_member_entity_1 = require("../entities/gym-member.entity");
const activity_difficulty_1 = require("./activity-difficulty");
function normRole(r) {
    return (r ?? '').trim().toLowerCase();
}
function normUrls(urls) {
    const out = [];
    for (const s of urls) {
        const u = s.trim();
        if (!u)
            continue;
        if (u.length > 800) {
            throw new common_1.BadRequestException('Cada enlace puede tener como máximo 800 caracteres.');
        }
        try {
            const p = new URL(u);
            if (p.protocol !== 'http:' && p.protocol !== 'https:') {
                throw new common_1.BadRequestException('Solo enlaces http(s).');
            }
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            throw new common_1.BadRequestException(`URL no válida: ${u}`);
        }
        out.push(u);
    }
    return out;
}
function trainerDisplayName(m) {
    if (!m)
        return '—';
    const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
    if (parts)
        return parts;
    return m.username ?? `ID ${m.id}`;
}
let ActivitiesService = class ActivitiesService {
    constructor(activities, categories, videos, trainers, members) {
        this.activities = activities;
        this.categories = categories;
        this.videos = videos;
        this.trainers = trainers;
        this.members = members;
    }
    listCategories() {
        return this.categories.find({ order: { name: 'ASC' } });
    }
    async createCategory(dto) {
        const name = dto.name.trim();
        const row = this.categories.create({ name });
        return this.categories.save(row);
    }
    async listActivities() {
        const rows = await this.activities.find({
            relations: ['category', 'trainers', 'trainers.member', 'videos'],
            order: { id: 'DESC' },
        });
        return rows.map((a) => ({
            id: a.id,
            title: a.title,
            category_id: a.category?.id ?? 0,
            category_name: a.category?.name ?? '',
            description: a.description,
            difficulty_level: (0, activity_difficulty_1.normalizeActivityDifficulty)(a.difficulty_level),
            trainer_names: (a.trainers ?? []).map((t) => trainerDisplayName(t.member)),
            video_count: (a.videos ?? []).length,
        }));
    }
    async getOne(id) {
        const a = await this.activities.findOne({
            where: { id },
            relations: ['category', 'trainers', 'trainers.member', 'videos'],
        });
        if (!a)
            throw new common_1.NotFoundException('Actividad no encontrada.');
        return this.serializeDetail(a);
    }
    async createActivity(dto, actor) {
        await this.assertCategory(dto.category_id);
        const trainerIds = [...new Set(dto.trainer_member_ids)];
        await this.assertTrainerIds(trainerIds, actor);
        const urls = normUrls(dto.video_urls ?? []);
        const entity = this.activities.create({
            category: { id: dto.category_id },
            title: dto.title.trim(),
            description: dto.description?.trim() || null,
            difficulty_level: (0, activity_difficulty_1.normalizeActivityDifficulty)(dto.difficulty_level),
        });
        const saved = await this.activities.save(entity);
        await this.replaceVideos(saved.id, urls);
        await this.replaceTrainers(saved.id, trainerIds);
        return this.getOne(saved.id);
    }
    async updateActivity(id, dto, actor) {
        const a = await this.activities.findOne({ where: { id } });
        if (!a)
            throw new common_1.NotFoundException('Actividad no encontrada.');
        if (dto.category_id != null) {
            await this.assertCategory(dto.category_id);
            a.category = { id: dto.category_id };
        }
        if (dto.title !== undefined) {
            const t = dto.title.trim();
            if (!t)
                throw new common_1.BadRequestException('El título no puede quedar vacío.');
            a.title = t;
        }
        if (dto.description !== undefined) {
            a.description =
                dto.description === null || dto.description === ''
                    ? null
                    : dto.description.trim() || null;
        }
        if (dto.difficulty_level !== undefined) {
            a.difficulty_level = (0, activity_difficulty_1.normalizeActivityDifficulty)(dto.difficulty_level);
        }
        await this.activities.save(a);
        if (dto.video_urls !== undefined) {
            await this.replaceVideos(id, normUrls(dto.video_urls));
        }
        if (dto.trainer_member_ids !== undefined) {
            const trainerIds = [...new Set(dto.trainer_member_ids)];
            if (trainerIds.length === 0) {
                throw new common_1.BadRequestException('Debe asignarse al menos un entrenador.');
            }
            await this.assertTrainerIds(trainerIds, actor);
            await this.replaceTrainers(id, trainerIds);
        }
        return this.getOne(id);
    }
    async remove(id) {
        const r = await this.activities.delete({ id });
        if (!r.affected)
            throw new common_1.NotFoundException('Actividad no encontrada.');
    }
    serializeDetail(a) {
        const vids = [...(a.videos ?? [])].sort((x, y) => x.sort_order - y.sort_order);
        return {
            id: a.id,
            category_id: a.category?.id ?? 0,
            title: a.title,
            description: a.description,
            difficulty_level: (0, activity_difficulty_1.normalizeActivityDifficulty)(a.difficulty_level),
            created_at: a.created_at instanceof Date
                ? a.created_at.toISOString()
                : String(a.created_at),
            category: a.category
                ? { id: a.category.id, name: a.category.name }
                : null,
            videos: vids.map((v) => ({
                id: v.id,
                url: v.url,
                sort_order: v.sort_order,
            })),
            trainers: (a.trainers ?? []).map((t) => ({
                member_id: t.trainer_member_id,
                first_name: t.member?.first_name ?? null,
                last_name: t.member?.last_name ?? null,
                username: t.member?.username ?? null,
            })),
        };
    }
    async assertCategory(id) {
        const c = await this.categories.findOne({ where: { id } });
        if (!c)
            throw new common_1.BadRequestException('Categoría no encontrada.');
    }
    async assertTrainerIds(ids, actor) {
        const ar = normRole(actor.role_name);
        if (ar === 'staff_member') {
            for (const id of ids) {
                if (id !== actor.userId) {
                    throw new common_1.ForbiddenException('Solo puedes asignarte a ti mismo como entrenador.');
                }
            }
        }
        const rows = await this.members.findBy({ id: (0, typeorm_2.In)(ids) });
        if (rows.length !== ids.length) {
            throw new common_1.BadRequestException('Algún entrenador no existe.');
        }
        for (const m of rows) {
            if (normRole(m.role_name) !== 'staff_member') {
                throw new common_1.BadRequestException(`El miembro ${m.id} no es personal entrenador.`);
            }
        }
    }
    async replaceVideos(activityId, urls) {
        await this.videos
            .createQueryBuilder()
            .delete()
            .from(activity_video_entity_1.ActivityVideo)
            .where('activity_id = :id', { id: activityId })
            .execute();
        if (urls.length === 0)
            return;
        await this.videos.save(urls.map((url, i) => this.videos.create({
            activity: { id: activityId },
            url,
            sort_order: i,
        })));
    }
    async replaceTrainers(activityId, memberIds) {
        await this.trainers
            .createQueryBuilder()
            .delete()
            .from(activity_trainer_entity_1.ActivityTrainer)
            .where('activity_id = :id', { id: activityId })
            .execute();
        await this.trainers.save(memberIds.map((id) => this.trainers.create({
            activity: { id: activityId },
            member: { id },
        })));
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_category_entity_1.ActivityCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_video_entity_1.ActivityVideo)),
    __param(3, (0, typeorm_1.InjectRepository)(activity_trainer_entity_1.ActivityTrainer)),
    __param(4, (0, typeorm_1.InjectRepository)(gym_member_entity_1.GymMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map
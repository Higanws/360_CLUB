import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { ActivityCategory } from '../entities/activity-category.entity';
import { ActivityTrainer } from '../entities/activity-trainer.entity';
import { ActivityVideo } from '../entities/activity-video.entity';
import { GymMember } from '../entities/gym-member.entity';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { normalizeActivityDifficulty } from './activity-difficulty';

function normRole(r: string | null | undefined): string {
  return (r ?? '').trim().toLowerCase();
}

function normUrls(urls: string[]): string[] {
  const out: string[] = [];
  for (const s of urls) {
    const u = s.trim();
    if (!u) continue;
    if (u.length > 800) {
      throw new BadRequestException('Cada enlace puede tener como máximo 800 caracteres.');
    }
    try {
      const p = new URL(u);
      if (p.protocol !== 'http:' && p.protocol !== 'https:') {
        throw new BadRequestException('Solo enlaces http(s).');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`URL no válida: ${u}`);
    }
    out.push(u);
  }
  return out;
}

function trainerDisplayName(m: GymMember | undefined): string {
  if (!m) return '—';
  const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return m.username ?? `ID ${m.id}`;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    @InjectRepository(ActivityCategory)
    private readonly categories: Repository<ActivityCategory>,
    @InjectRepository(ActivityVideo)
    private readonly videos: Repository<ActivityVideo>,
    @InjectRepository(ActivityTrainer)
    private readonly trainers: Repository<ActivityTrainer>,
    @InjectRepository(GymMember)
    private readonly members: Repository<GymMember>,
  ) {}

  listCategories(): Promise<ActivityCategory[]> {
    return this.categories.find({ order: { name: 'ASC' } });
  }

  async createCategory(dto: CreateActivityCategoryDto): Promise<ActivityCategory> {
    const name = dto.name.trim();
    const row = this.categories.create({ name });
    return this.categories.save(row);
  }

  async listActivities(): Promise<
    {
      id: number;
      title: string;
      category_id: number;
      category_name: string;
      description: string | null;
      difficulty_level: string;
      trainer_names: string[];
      video_count: number;
    }[]
  > {
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
      difficulty_level: normalizeActivityDifficulty(a.difficulty_level),
      trainer_names: (a.trainers ?? []).map((t) =>
        trainerDisplayName(t.member),
      ),
      video_count: (a.videos ?? []).length,
    }));
  }

  async getOne(id: number) {
    const a = await this.activities.findOne({
      where: { id },
      relations: ['category', 'trainers', 'trainers.member', 'videos'],
    });
    if (!a) throw new NotFoundException('Actividad no encontrada.');
    return this.serializeDetail(a);
  }

  async createActivity(
    dto: CreateActivityDto,
    actor: { userId: number; role_name: string },
  ) {
    await this.assertCategory(dto.category_id);
    const trainerIds = [...new Set(dto.trainer_member_ids)];
    await this.assertTrainerIds(trainerIds, actor);
    const urls = normUrls(dto.video_urls ?? []);

    const entity = this.activities.create({
      category: { id: dto.category_id } as ActivityCategory,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      difficulty_level: normalizeActivityDifficulty(dto.difficulty_level),
    });
    const saved = await this.activities.save(entity);
    await this.replaceVideos(saved.id, urls);
    await this.replaceTrainers(saved.id, trainerIds);
    return this.getOne(saved.id);
  }

  async updateActivity(
    id: number,
    dto: UpdateActivityDto,
    actor: { userId: number; role_name: string },
  ) {
    const a = await this.activities.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Actividad no encontrada.');

    if (dto.category_id != null) {
      await this.assertCategory(dto.category_id);
      a.category = { id: dto.category_id } as ActivityCategory;
    }
    if (dto.title !== undefined) {
      const t = dto.title.trim();
      if (!t) throw new BadRequestException('El título no puede quedar vacío.');
      a.title = t;
    }
    if (dto.description !== undefined) {
      a.description =
        dto.description === null || dto.description === ''
          ? null
          : dto.description.trim() || null;
    }
    if (dto.difficulty_level !== undefined) {
      a.difficulty_level = normalizeActivityDifficulty(dto.difficulty_level);
    }
    await this.activities.save(a);

    if (dto.video_urls !== undefined) {
      await this.replaceVideos(id, normUrls(dto.video_urls));
    }
    if (dto.trainer_member_ids !== undefined) {
      const trainerIds = [...new Set(dto.trainer_member_ids)];
      if (trainerIds.length === 0) {
        throw new BadRequestException('Debe asignarse al menos un entrenador.');
      }
      await this.assertTrainerIds(trainerIds, actor);
      await this.replaceTrainers(id, trainerIds);
    }

    return this.getOne(id);
  }

  async remove(id: number): Promise<void> {
    const r = await this.activities.delete({ id });
    if (!r.affected) throw new NotFoundException('Actividad no encontrada.');
  }

  private serializeDetail(a: Activity) {
    const vids = [...(a.videos ?? [])].sort(
      (x, y) => x.sort_order - y.sort_order,
    );
    return {
      id: a.id,
      category_id: a.category?.id ?? 0,
      title: a.title,
      description: a.description,
      difficulty_level: normalizeActivityDifficulty(a.difficulty_level),
      created_at:
        a.created_at instanceof Date
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

  private async assertCategory(id: number): Promise<void> {
    const c = await this.categories.findOne({ where: { id } });
    if (!c) throw new BadRequestException('Categoría no encontrada.');
  }

  private async assertTrainerIds(
    ids: number[],
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    const ar = normRole(actor.role_name);
    if (ar === 'staff_member') {
      for (const id of ids) {
        if (id !== actor.userId) {
          throw new ForbiddenException(
            'Solo puedes asignarte a ti mismo como entrenador.',
          );
        }
      }
    }
    const rows = await this.members.findBy({ id: In(ids) });
    if (rows.length !== ids.length) {
      throw new BadRequestException('Algún entrenador no existe.');
    }
    for (const m of rows) {
      if (normRole(m.role_name) !== 'staff_member') {
        throw new BadRequestException(
          `El miembro ${m.id} no es personal entrenador.`,
        );
      }
    }
  }

  private async replaceVideos(activityId: number, urls: string[]): Promise<void> {
    await this.videos
      .createQueryBuilder()
      .delete()
      .from(ActivityVideo)
      .where('activity_id = :id', { id: activityId })
      .execute();
    if (urls.length === 0) return;
    await this.videos.save(
      urls.map((url, i) =>
        this.videos.create({
          activity: { id: activityId } as Activity,
          url,
          sort_order: i,
        }),
      ),
    );
  }

  private async replaceTrainers(
    activityId: number,
    memberIds: number[],
  ): Promise<void> {
    await this.trainers
      .createQueryBuilder()
      .delete()
      .from(ActivityTrainer)
      .where('activity_id = :id', { id: activityId })
      .execute();
    await this.trainers.save(
      memberIds.map((id) =>
        this.trainers.create({
          activity: { id: activityId } as Activity,
          member: { id } as GymMember,
        }),
      ),
    );
  }
}

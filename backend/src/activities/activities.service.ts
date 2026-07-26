import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Activity,
  ActivityCategory,
  GymMember,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { normalizeClubRole } from '../shared/domain/club/club-roles';
import {
  buildPageMeta,
  paginationSkip,
} from '../shared/dto/paginated-meta';
import { normalizeActivityDifficulty } from './activity-difficulty';

type ActivityWithRelations = Activity & {
  category: ActivityCategory | null;
  trainers?: Array<{ trainer_member_id: number; member: GymMember | null }>;
  videos?: Array<{ id: number; url: string; sort_order: number }>;
};

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

function trainerDisplayName(m: GymMember | null | undefined): string {
  if (!m) return '—';
  const parts = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return m.username ?? `ID ${m.id}`;
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(): Promise<ActivityCategory[]> {
    return this.prisma.activityCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateActivityCategoryDto): Promise<ActivityCategory> {
    const name = dto.name.trim();
    return this.prisma.activityCategory.create({ data: { name } });
  }

  async listActivities(
    page = 1,
    pageSize = 25,
    q?: string,
  ): Promise<{
    activities: Array<{
      id: number;
      title: string;
      category_id: number;
      category_name: string;
      description: string | null;
      difficulty_level: string;
      trainer_names: string[];
      video_count: number;
    }>;
    meta: ReturnType<typeof buildPageMeta>;
  }> {
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const qTrim = q?.trim();
    const where: Prisma.ActivityWhereInput = qTrim
      ? {
          OR: [
            { title: { contains: qTrim } },
            { category: { name: { contains: qTrim } } },
          ],
        }
      : {};

    const total = await this.prisma.activity.count({ where });
    const rows = (await this.prisma.activity.findMany({
      where,
      include: {
        category: true,
        trainers: { include: { member: true } },
      },
      orderBy: { id: 'desc' },
      skip: paginationSkip(pg, ps),
      take: ps,
    })) as ActivityWithRelations[];

    const ids = rows.map((r) => r.id);
    const videoCounts = ids.length
      ? await this.prisma.activityVideo.groupBy({
          by: ['activity_id'],
          where: { activity_id: { in: ids } },
          _count: { id: true },
        })
      : [];
    const countByActivity = new Map(
      videoCounts.map((r) => [r.activity_id, r._count.id]),
    );

    const activities = rows.map((a) => ({
      id: a.id,
      title: a.title,
      category_id: a.category?.id ?? 0,
      category_name: a.category?.name ?? '',
      description: a.description,
      difficulty_level: normalizeActivityDifficulty(a.difficulty_level),
      trainer_names: (a.trainers ?? []).map((t) =>
        trainerDisplayName(t.member),
      ),
      video_count: countByActivity.get(a.id) ?? 0,
    }));

    return { activities, meta: buildPageMeta(total, pg, ps) };
  }

  async getOne(id: number) {
    const a = (await this.prisma.activity.findUnique({
      where: { id },
      include: {
        category: true,
        trainers: { include: { member: true } },
        videos: true,
      },
    })) as ActivityWithRelations | null;
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

    const saved = await this.prisma.activity.create({
      data: {
        category_id: dto.category_id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        difficulty_level: normalizeActivityDifficulty(dto.difficulty_level),
      },
    });
    await this.replaceVideos(saved.id, urls);
    await this.replaceTrainers(saved.id, trainerIds);
    return this.getOne(saved.id);
  }

  async updateActivity(
    id: number,
    dto: UpdateActivityDto,
    actor: { userId: number; role_name: string },
  ) {
    const a = await this.prisma.activity.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Actividad no encontrada.');

    const data: Prisma.ActivityUpdateInput = {};

    if (dto.category_id != null) {
      await this.assertCategory(dto.category_id);
      data.category = { connect: { id: dto.category_id } };
    }
    if (dto.title !== undefined) {
      const t = dto.title.trim();
      if (!t) throw new BadRequestException('El título no puede quedar vacío.');
      data.title = t;
    }
    if (dto.description !== undefined) {
      data.description =
        dto.description === null || dto.description === ''
          ? null
          : dto.description.trim() || null;
    }
    if (dto.difficulty_level !== undefined) {
      data.difficulty_level = normalizeActivityDifficulty(dto.difficulty_level);
    }
    await this.prisma.activity.update({ where: { id }, data });

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
    try {
      await this.prisma.activity.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Actividad no encontrada.');
    }
  }

  private serializeDetail(a: ActivityWithRelations) {
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
    const c = await this.prisma.activityCategory.findUnique({
      where: { id },
    });
    if (!c) throw new BadRequestException('Categoría no encontrada.');
  }

  private async assertTrainerIds(
    ids: number[],
    actor: { userId: number; role_name: string },
  ): Promise<void> {
    const ar = normalizeClubRole(actor.role_name);
    if (ar === 'staff_member') {
      for (const id of ids) {
        if (id !== actor.userId) {
          throw new ForbiddenException(
            'Solo puedes asignarte a ti mismo como entrenador.',
          );
        }
      }
    }
    const rows = await this.prisma.gymMember.findMany({
      where: { id: { in: ids } },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException('Algún entrenador no existe.');
    }
    for (const m of rows) {
      if (normalizeClubRole(m.role_name) !== 'staff_member') {
        throw new BadRequestException(
          `El miembro ${m.id} no es personal entrenador.`,
        );
      }
    }
  }

  private async replaceVideos(activityId: number, urls: string[]): Promise<void> {
    await this.prisma.activityVideo.deleteMany({
      where: { activity_id: activityId },
    });
    if (urls.length === 0) return;
    await this.prisma.activityVideo.createMany({
      data: urls.map((url, i) => ({
        activity_id: activityId,
        url,
        sort_order: i,
      })),
    });
  }

  private async replaceTrainers(
    activityId: number,
    memberIds: number[],
  ): Promise<void> {
    await this.prisma.activityTrainer.deleteMany({
      where: { activity_id: activityId },
    });
    if (memberIds.length === 0) return;
    await this.prisma.activityTrainer.createMany({
      data: memberIds.map((trainer_member_id) => ({
        activity_id: activityId,
        trainer_member_id,
      })),
    });
  }
}

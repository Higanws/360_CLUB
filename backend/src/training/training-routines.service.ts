import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { normalizeActivityDifficulty } from '../activities/activity-difficulty';
import {
  computeRoutineDifficulty,
  normalizeRoutineDifficulty,
} from './routine-difficulty';
import { CreateTrainingRoutineDto } from './dto/create-training-routine.dto';
import { UpdateTrainingRoutineDto } from './dto/update-training-routine.dto';
import type { TrainingRoutineLineDto } from './dto/training-routine-line.dto';
import {
  buildPageMeta,
  paginationSkip,
} from '../shared/dto/paginated-meta';

type NormalizedLine = {
  activity_id: number;
  weight_kg: number | null;
  weekdays_mask: number;
};

@Injectable()
export class TrainingRoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, pageSize = 25, q?: string) {
    const ps = Math.min(100, Math.max(1, pageSize));
    const pg = Math.max(1, page);

    const qTrim = q?.trim();
    const where = qTrim ? { title: { contains: qTrim } } : {};

    const total = await this.prisma.trainingRoutine.count({ where });
    const rows = await this.prisma.trainingRoutine.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: paginationSkip(pg, ps),
      take: ps,
    });

    const ids = rows.map((r) => r.id);
    const lineCounts = ids.length
      ? await this.prisma.trainingRoutineActivity.groupBy({
          by: ['routine_id'],
          where: { routine_id: { in: ids } },
          _count: { id: true },
        })
      : [];
    const countByRoutine = new Map(
      lineCounts.map((r) => [r.routine_id, r._count.id]),
    );

    const routines = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      difficulty_level: normalizeRoutineDifficulty(r.difficulty_level),
      exercise_count: countByRoutine.get(r.id) ?? 0,
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    }));

    return { routines, meta: buildPageMeta(total, pg, ps) };
  }

  async getOne(id: number) {
    const r = await this.prisma.trainingRoutine.findUnique({
      where: { id },
      include: {
        lines: { include: { activity: { include: { category: true } } } },
      },
    });
    if (!r) throw new NotFoundException('Rutina no encontrada.');
    const ordered = [...(r.lines ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      difficulty_level: normalizeRoutineDifficulty(r.difficulty_level),
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
      activity_ids: ordered.map((l) => l.activity_id),
      exercises: ordered.map((l) => ({
        activity_id: l.activity_id,
        weight_kg:
          l.weight_kg !== null && l.weight_kg !== undefined
            ? Number(l.weight_kg)
            : null,
        weekdays_mask:
          l.weekdays_mask !== null && l.weekdays_mask !== undefined
            ? Number(l.weekdays_mask) & 127
            : 127,
        title: l.activity?.title ?? '',
        difficulty_level: normalizeActivityDifficulty(
          l.activity?.difficulty_level,
        ),
        category_name: l.activity?.category?.name ?? '',
      })),
    };
  }

  async create(dto: CreateTrainingRoutineDto) {
    const normalized = this.normalizeLines(dto.lines);
    const orderedIds = normalized.map((row) => row.activity_id);
    const difficulty = await this.computeDifficultyForOrderedIds(orderedIds);
    const saved = await this.prisma.trainingRoutine.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        difficulty_level: difficulty,
      },
    });
    await this.replaceLines(saved.id, normalized);
    return this.getOne(saved.id);
  }

  async update(id: number, dto: UpdateTrainingRoutineDto) {
    const r = await this.prisma.trainingRoutine.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Rutina no encontrada.');

    const data: { title?: string; description?: string | null; difficulty_level?: string } = {};
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
    if (dto.lines !== undefined) {
      const normalized = this.normalizeLines(dto.lines);
      const orderedIds = normalized.map((row) => row.activity_id);
      data.difficulty_level =
        await this.computeDifficultyForOrderedIds(orderedIds);
      await this.replaceLines(id, normalized);
    }
    if (Object.keys(data).length > 0) {
      await this.prisma.trainingRoutine.update({ where: { id }, data });
    }
    return this.getOne(id);
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.trainingRoutine.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Rutina no encontrada.');
    }
  }

  private normalizeLines(lines: TrainingRoutineLineDto[]): NormalizedLine[] {
    const seen = new Set<number>();
    const out: NormalizedLine[] = [];
    for (const row of lines) {
      const id = Number(row.activity_id);
      if (!Number.isFinite(id) || id < 1) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      const w = row.weight_kg;
      let weight_kg: number | null = null;
      if (w !== undefined && w !== null && Number.isFinite(Number(w))) {
        const n = Number(w);
        if (n >= 0) weight_kg = Math.round(n * 100) / 100;
      }
      let weekdays_mask = 127;
      const wm = row.weekdays_mask;
      if (wm !== undefined && wm !== null && Number.isFinite(Number(wm))) {
        weekdays_mask = Number(wm) & 127;
      }
      if (weekdays_mask < 1) {
        throw new BadRequestException(
          'Cada ejercicio debe tener al menos un día de la semana seleccionado.',
        );
      }
      out.push({ activity_id: id, weight_kg, weekdays_mask });
    }
    if (out.length === 0) {
      throw new BadRequestException('Añade al menos un ejercicio válido.');
    }
    return out;
  }

  private async computeDifficultyForOrderedIds(
    orderedActivityIds: number[],
  ): Promise<string> {
    const acts = await this.prisma.activity.findMany({
      where: { id: { in: orderedActivityIds } },
    });
    if (acts.length !== orderedActivityIds.length) {
      throw new BadRequestException('Alguna actividad no existe.');
    }
    const byId = new Map(acts.map((a) => [a.id, a]));
    const levels = orderedActivityIds.map((aid) =>
      normalizeActivityDifficulty(byId.get(aid)?.difficulty_level),
    );
    return computeRoutineDifficulty(levels);
  }

  private async replaceLines(
    routineId: number,
    rows: NormalizedLine[],
  ): Promise<void> {
    await this.prisma.trainingRoutineActivity.deleteMany({
      where: { routine_id: routineId },
    });
    await this.prisma.trainingRoutineActivity.createMany({
      data: rows.map((row, sort_order) => ({
        routine_id: routineId,
        activity_id: row.activity_id,
        sort_order,
        weight_kg: row.weight_kg,
        weekdays_mask: row.weekdays_mask,
      })),
    });
  }
}

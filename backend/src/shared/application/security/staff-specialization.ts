import { PrismaService } from '../../../database/prisma.service';

/** Nombres canónicos de especialización (seed). Comparar en minúsculas. */
export const STAFF_SPEC = {
  ENTRENADOR: 'entrenador',
  NUTRICIONISTA: 'nutricionista',
  CAJERO: 'cajero',
  STOCK: 'stock',
} as const;

export type StaffSpecName =
  (typeof STAFF_SPEC)[keyof typeof STAFF_SPEC];

export function decodeSpecializationIds(json: string | null | undefined): number[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => parseInt(String(x), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
  } catch {
    return [];
  }
}

export function encodeSpecializationIds(ids: number[]): string {
  return JSON.stringify(ids.map((id) => String(id)));
}

export async function loadStaffSpecializationNames(
  prisma: PrismaService,
  userId: number,
): Promise<{ ids: number[]; names: string[]; labeled: { id: number; name: string }[] }> {
  const member = await prisma.gymMember.findUnique({
    where: { id: userId },
    select: { s_specialization: true },
  });
  const ids = decodeSpecializationIds(member?.s_specialization);
  if (ids.length === 0) {
    return { ids: [], names: [], labeled: [] };
  }
  const rows = await prisma.specialization.findMany({
    where: { id: { in: ids } },
    orderBy: { id: 'asc' },
  });
  const labeled = rows.map((r) => ({
    id: r.id,
    name: (r.name ?? '').trim() || `Spec ${r.id}`,
  }));
  const names = labeled.map((r) => r.name.trim().toLowerCase());
  return { ids, names, labeled };
}

export function staffHasAnySpec(
  namesLower: string[],
  allowed: readonly string[],
): boolean {
  const set = new Set(namesLower.map((n) => n.trim().toLowerCase()));
  return allowed.some((a) => set.has(a.trim().toLowerCase()));
}

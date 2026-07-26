import { api } from './api';

/** Respuesta `GET /members` (paginada). */
export type MembersListApiPayload = {
  title: string;
  subtitle: string;
  members: Array<{
    id: number;
    activated?: number | null;
    member_id?: string | null;
    first_name: string | null;
    last_name: string | null;
    image?: string | null;
    membership_status?: string | null;
    membership_valid_from?: string | null;
    membership_valid_to?: string | null;
  }>;
  meta: {
    role_name: string;
    can_add_member: boolean;
    show_status_column: boolean;
    date_format: string | null;
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export async function fetchMembersListPage(
  page: number,
  pageSize: number,
  q?: string,
): Promise<MembersListApiPayload> {
  const params: Record<string, string | number> = { page, pageSize };
  const qTrim = q?.trim();
  if (qTrim) params.q = qTrim;
  const { data } = await api.get<MembersListApiPayload>('/members', {
    params,
  });
  return data;
}

const MAX_PAGE_SIZE = 500;

export type MemberLiteRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
};

/** Búsqueda server-side para comboboxes (mín. 2 caracteres en la UI). */
export async function searchMembersLite(
  q: string,
  limit = 20,
): Promise<MemberLiteRow[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const { data } = await api.get<{ members: MemberLiteRow[] }>(
    '/members/search',
    { params: { q: trimmed, limit } },
  );
  return (data.members ?? []).map((m) => ({
    id: m.id,
    first_name: m.first_name,
    last_name: m.last_name,
  }));
}

/** @deprecated Usar searchMembersLite en comboboxes; solo tests/admin. */
export async function fetchAllMembersLiteRows(
  pageSize = 200,
): Promise<
  Array<{ id: number; first_name: string | null; last_name: string | null }>
> {
  const ps = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
  const first = await fetchMembersListPage(1, ps);
  const rows = [...first.members];
  const pageCount = first.meta.pageCount ?? 1;
  for (let p = 2; p <= pageCount; p += 1) {
    const d = await fetchMembersListPage(p, ps);
    rows.push(...d.members);
  }
  return rows.map((m) => ({
    id: m.id,
    first_name: m.first_name,
    last_name: m.last_name,
  }));
}

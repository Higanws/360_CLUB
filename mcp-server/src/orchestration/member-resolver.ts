import type { Club360Client } from '../client/club360-client.js';

export type MemberLite = {
  id: number;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  username?: string | null;
  di_dni_number?: string | null;
};

type MembersListResponse = {
  members: MemberLite[];
  meta: { page: number; pageCount: number; total: number };
};

type SearchResponse = {
  members: MemberLite[];
  total: number;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function matchesMember(m: MemberLite, q: string): boolean {
  const n = normalize(q);
  const parts = [
    m.first_name,
    m.last_name,
    `${m.first_name ?? ''} ${m.last_name ?? ''}`,
    m.member_id,
    m.username,
    m.di_dni_number,
  ]
    .filter(Boolean)
    .map((x) => normalize(String(x)));
  return parts.some((p) => p.includes(n));
}

export async function findMembers(
  client: Club360Client,
  query: string,
  limit = 20,
): Promise<MemberLite[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const search = await client.request<SearchResponse>('/members/search', {
      query: { q, limit },
    });
    if (search.members?.length) return search.members.slice(0, limit);
  } catch {
    /* fallback paginado */
  }

  const results: MemberLite[] = [];
  let page = 1;
  const pageSize = 100;
  while (page <= 20 && results.length < limit) {
    const res = await client.request<MembersListResponse>('/members', {
      query: { page, pageSize },
    });
    for (const m of res.members) {
      if (matchesMember(m, q)) results.push(m);
      if (results.length >= limit) break;
    }
    if (page >= res.meta.pageCount) break;
    page += 1;
  }
  return results;
}

export async function resolveMemberId(
  client: Club360Client,
  opts: { member_id?: number; member_query?: string },
): Promise<number> {
  if (opts.member_id !== undefined && opts.member_id > 0) {
    return opts.member_id;
  }
  const q = opts.member_query?.trim();
  if (!q) {
    throw new Error('Indicá member_id o member_query (nombre, DNI, username).');
  }
  const found = await findMembers(client, q, 5);
  if (found.length === 0) {
    throw new Error(`Ningún socio coincide con "${q}". Usá member_find.`);
  }
  if (found.length > 1) {
    throw new Error(
      `Varios socios coinciden con "${q}": ${found.map((m) => `${m.id}:${m.first_name} ${m.last_name}`).join(', ')}. Elegí member_id.`,
    );
  }
  return found[0]!.id;
}

export async function findStaff(
  client: Club360Client,
  query: string,
  limit = 20,
): Promise<MemberLite[]> {
  const q = query.trim();
  if (!q) return [];
  type StaffRow = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    username?: string | null;
  };
  const list = await client.request<StaffRow[]>('/staff');
  return list
    .filter((s) =>
      matchesMember(
        {
          id: s.id,
          member_id: null,
          first_name: s.first_name,
          last_name: s.last_name,
          username: s.username,
        },
        q,
      ),
    )
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      member_id: null,
      first_name: s.first_name,
      last_name: s.last_name,
      username: s.username,
    }));
}

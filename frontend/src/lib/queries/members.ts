import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchMembersListPage,
  searchMembersLite,
  type MembersListApiPayload,
  type MemberLiteRow,
} from '../members-api';

export function useMembersList(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['members', 'list', page, pageSize],
    queryFn: () => fetchMembersListPage(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useMembersSearch(q: string, limit = 20) {
  const trimmed = q.trim();
  return useQuery<{ members: MemberLiteRow[]; total: number }>({
    queryKey: ['members', 'search', trimmed, limit],
    queryFn: async () => {
      const members = await searchMembersLite(trimmed, limit);
      return { members, total: members.length };
    },
    enabled: trimmed.length >= 2,
  });
}

export type { MembersListApiPayload };

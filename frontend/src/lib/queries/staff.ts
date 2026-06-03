import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export type StaffPayload = {
  staff: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
    image: string | null;
    email: string | null;
    mobile: string | null;
    club_role_name: string | null;
  }>;
  meta: {
    can_manage: boolean;
    is_administrator: boolean;
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export function useStaffList(page = 1, pageSize = 25, enabled = true) {
  return useQuery({
    queryKey: ['staff', 'list', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<StaffPayload>('/staff', {
        params: { page, pageSize },
      });
      return data;
    },
    enabled,
  });
}

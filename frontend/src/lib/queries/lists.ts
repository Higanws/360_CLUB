import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { PaginatedMeta } from '../pagination';

export function useActivitiesList(
  page: number,
  pageSize: number,
  q = '',
) {
  return useQuery({
    queryKey: ['activities', 'list', page, pageSize, q],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize };
      const qTrim = q.trim();
      if (qTrim) params.q = qTrim;
      const { data } = await api.get<{
        activities: Array<{
          id: number;
          title: string;
          category_name: string;
          difficulty_level: string;
          trainer_names: string[];
          video_count: number;
        }>;
        meta: PaginatedMeta;
      }>('/activities', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useTrainingRoutinesList(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['training-routines', 'list', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        routines: Array<{
          id: number;
          title: string;
          difficulty_level: string;
          exercise_count: number;
        }>;
        meta: PaginatedMeta;
      }>('/training-routines', { params: { page, pageSize } });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useMembershipPaymentsList(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['membership-payments', 'expiring', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        title: string;
        subtitle: string;
        rows: Array<Record<string, unknown>>;
        meta: PaginatedMeta;
      }>('/payments/membership/expiring-this-month', {
        params: { page, pageSize },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function usePosSalesList(
  from: string,
  to: string,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['pos', 'sales', from, to, page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        sales: Array<Record<string, unknown>>;
        meta: PaginatedMeta;
      }>('/pos/sales', { params: { from, to, page, pageSize } });
      return data;
    },
    enabled: enabled && !!from && !!to,
    placeholderData: keepPreviousData,
  });
}

export function useAccessLogsList(
  from: string,
  to: string,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['access-control', 'recent', from, to, page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        logs: Array<Record<string, unknown>>;
        meta: PaginatedMeta;
      }>('/access-control/recent', { params: { from, to, page, pageSize } });
      return data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useNutritionOverview(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: ['nutrition', 'overview', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<{
        rows: Array<Record<string, unknown>>;
        meta: PaginatedMeta;
      }>('/nutrition/overview', { params: { page, pageSize } });
      return data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useTrainingAssignmentsList(
  page: number,
  pageSize: number,
  q: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['training-assignments', 'list', page, pageSize, q],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize };
      const qTrim = q.trim();
      if (qTrim) params.q = qTrim;
      const { data } = await api.get<{
        assignments: Array<Record<string, unknown>>;
        meta: PaginatedMeta;
      }>('/training-assignments', { params });
      return data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

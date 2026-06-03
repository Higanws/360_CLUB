import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export type BusinessMetrics = {
  generated_at: string;
  summary: {
    members: number;
    staff: number;
    active_members: number;
    membership_plans: number;
    catalog_products: number;
    exercises: number;
    training_routines: number;
    nutrition_plans: number;
  };
  membership_debt: {
    pending_invoices: number;
    total_owed: number;
  };
  sales_last_30d: Array<{
    date: string;
    revenue: number;
    sales_count: number;
  }>;
  access_last_14d: Array<{
    date: string;
    allowed: number;
    denied: number;
  }>;
};

export function useBusinessMetrics(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'business-metrics'],
    queryFn: async () => {
      const { data } = await api.get<BusinessMetrics>(
        '/dashboard/business-metrics',
      );
      return data;
    },
    staleTime: 60_000,
    enabled,
  });
}

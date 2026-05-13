import { DataSource } from 'typeorm';
export type DashboardBusinessMetrics = {
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
export declare class DashboardService {
    private readonly ds;
    constructor(ds: DataSource);
    getBusinessMetrics(): Promise<DashboardBusinessMetrics>;
}

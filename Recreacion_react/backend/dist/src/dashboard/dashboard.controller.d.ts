import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboard;
    constructor(dashboard: DashboardService);
    businessMetrics(): Promise<import("./dashboard.service").DashboardBusinessMetrics>;
}

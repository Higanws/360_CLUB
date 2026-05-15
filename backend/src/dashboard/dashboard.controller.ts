import { Controller, Get, UseGuards } from '@nestjs/common';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { AdministratorRoleGuard } from '../staff/administrator-role.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(BusinessRoleGuard, AdministratorRoleGuard)
@BusinessRoles()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('business-metrics')
  businessMetrics() {
    return this.dashboard.getBusinessMetrics();
  }
}

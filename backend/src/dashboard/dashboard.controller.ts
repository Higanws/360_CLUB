import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('business-metrics')
  businessMetrics() {
    return this.dashboard.getBusinessMetrics();
  }
}

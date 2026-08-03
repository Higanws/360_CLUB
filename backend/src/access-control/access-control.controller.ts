import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import {
  RequireStaffSpecs,
  StaffSpecializationGuard,
} from '../shared/application/security/staff-specialization.guard';
import { STAFF_SPEC } from '../shared/application/security/staff-specialization';
import { CheckAccessDto } from './dto/check-access.dto';
import { RecentAccessLogsQueryDto } from './dto/recent-access-logs-query.dto';
import { AccessControlService } from './access-control.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('access-control')
@UseGuards(BusinessRoleGuard, StaffSpecializationGuard)
@RequireStaffSpecs(STAFF_SPEC.CAJERO)
@BusinessRoles()
export class AccessControlController {
  constructor(private readonly access: AccessControlService) {}

  @Post('check')
  async check(@Req() req: JwtReq, @Body() dto: CheckAccessDto) {
    const record = dto.record !== false;
    return this.access.checkAndRecord(req.user, dto.lookup, record);
  }

  @Get('recent')
  recent(@Req() req: JwtReq, @Query() q: RecentAccessLogsQueryDto) {
    const pageSize = q.pageSize ?? q.limit ?? 25;
    return this.access.recentLogs(
      req.user,
      q.page ?? 1,
      pageSize,
      q.from?.trim(),
      q.to?.trim(),
    );
  }
}

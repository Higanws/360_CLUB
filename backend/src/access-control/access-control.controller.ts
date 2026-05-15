import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { CheckAccessDto } from './dto/check-access.dto';
import { AccessControlService } from './access-control.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('access-control')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class AccessControlController {
  constructor(private readonly access: AccessControlService) {}

  @Post('check')
  async check(@Req() req: JwtReq, @Body() dto: CheckAccessDto) {
    const record = dto.record !== false;
    return this.access.checkAndRecord(req.user, dto.lookup, record);
  }

  @Get('recent')
  recent(
    @Query('limit') limitRaw?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const n = parseInt(limitRaw ?? '100', 10);
    const limit = Number.isFinite(n) ? n : 100;
    return this.access.recentLogs(limit, from?.trim(), to?.trim());
  }
}

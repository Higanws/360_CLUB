import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { AdministratorRoleGuard } from '../staff/administrator-role.guard';
import { ManualMembershipPaymentDto } from './dto/manual-membership-payment.dto';
import { MembershipFormOptionsQueryDto } from './dto/membership-form-options-query.dto';
import { MembershipPaymentsService } from './membership-payments.service';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';

@Controller('payments/membership')
@UseGuards(BusinessRoleGuard, AdministratorRoleGuard)
@BusinessRoles()
export class MembershipPaymentsController {
  constructor(private readonly svc: MembershipPaymentsService) {}

  @Get('expiring-this-month')
  expiring(
    @Req() req: { user: { userId: number; role_name: string } },
    @Query() q: PaginationQueryDto,
  ) {
    return this.svc.listExpiringThisMonth(
      { userId: req.user.userId, role_name: req.user.role_name },
      q.page ?? 1,
      q.pageSize ?? 25,
    );
  }

  @Get('form-options')
  formOptions(
    @Req() req: { user: { userId: number; role_name: string } },
    @Query() q: MembershipFormOptionsQueryDto,
  ) {
    return this.svc.manualFormOptions(
      { userId: req.user.userId, role_name: req.user.role_name },
      q.q,
      q.limit ?? 20,
    );
  }

  @Post('manual')
  manual(
    @Body() dto: ManualMembershipPaymentDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.svc.registerManual(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Patch(':mpId/paid')
  markPaid(
    @Param('mpId', ParseIntPipe) mpId: number,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.svc.markPaid(mpId, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }
}

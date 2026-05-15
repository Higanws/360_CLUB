import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { ManualMembershipPaymentDto } from './dto/manual-membership-payment.dto';
import { MembershipPaymentsService } from './membership-payments.service';

@Controller('payments/membership')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class MembershipPaymentsController {
  constructor(private readonly svc: MembershipPaymentsService) {}

  @Get('expiring-this-month')
  expiring(@Req() req: { user: { userId: number; role_name: string } }) {
    return this.svc.listExpiringThisMonth({
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Get('form-options')
  formOptions(@Req() req: { user: { userId: number; role_name: string } }) {
    return this.svc.manualFormOptions({
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
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

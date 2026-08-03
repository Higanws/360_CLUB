import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import {
  RequireStaffSpecs,
  StaffSpecializationGuard,
} from '../shared/application/security/staff-specialization.guard';
import { STAFF_SPEC } from '../shared/application/security/staff-specialization';
import { NutritionOverviewQueryDto } from './dto/nutrition-overview-query.dto';
import { UpsertNutritionGeneralDto } from './dto/upsert-nutrition-general.dto';
import { UpsertNutritionPlanDto } from './dto/upsert-nutrition-plan.dto';
import { NutritionService } from './nutrition.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('nutrition')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard, StaffSpecializationGuard)
@RequireStaffSpecs(STAFF_SPEC.NUTRICIONISTA)
@BusinessRoles()
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Get('general')
  getGeneral(@Req() req: JwtReq) {
    return this.nutrition.getGeneralPlan({
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Put('general')
  upsertGeneral(@Body() dto: UpsertNutritionGeneralDto, @Req() req: JwtReq) {
    return this.nutrition.upsertGeneralPlan(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Get('overview')
  overview(@Req() req: JwtReq, @Query() q: NutritionOverviewQueryDto) {
    return this.nutrition.overview(
      { userId: req.user.userId, role_name: req.user.role_name },
      q.page ?? 1,
      q.pageSize ?? 25,
      q.q,
    );
  }

  @Get('members/:memberId/plan')
  getPlan(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() req: JwtReq,
  ) {
    return this.nutrition.getPlanForMember(memberId, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Put('members/:memberId/plan')
  upsertPlan(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpsertNutritionPlanDto,
    @Req() req: JwtReq,
  ) {
    return this.nutrition.upsertPlanForMember(memberId, dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete('members/:memberId/plan')
  deletePlan(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() req: JwtReq,
  ) {
    return this.nutrition.deletePlanForMember(memberId, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }
}

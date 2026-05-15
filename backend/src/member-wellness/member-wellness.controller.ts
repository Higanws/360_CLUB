import { Controller, Get, Query, Req } from '@nestjs/common';
import { MemberPreviewQueryDto } from './dto/member-preview-query.dto';
import { WeeklyRoutineQueryDto } from './dto/weekly-routine-query.dto';
import { MemberWellnessService } from './member-wellness.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('member-wellness')
export class MemberWellnessController {
  constructor(private readonly wellness: MemberWellnessService) {}

  @Get('my-nutrition-plan')
  myNutritionPlan(@Req() req: JwtReq, @Query() q: MemberPreviewQueryDto) {
    return this.wellness.getMyNutritionPlan(req.user, q.member_id);
  }

  @Get('my-training-context')
  myTrainingContext(@Req() req: JwtReq, @Query() q: MemberPreviewQueryDto) {
    return this.wellness.getMyTrainingContext(req.user, q.member_id);
  }

  @Get('weekly-routine')
  getWeeklyRoutine(
    @Req() req: JwtReq,
    @Query() q: WeeklyRoutineQueryDto,
  ) {
    return this.wellness.getWeeklyRoutine(req.user, q.week_start, q.member_id);
  }
}

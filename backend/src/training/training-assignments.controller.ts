import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import {
  RequireStaffSpecs,
  StaffSpecializationGuard,
} from '../shared/application/security/staff-specialization.guard';
import { STAFF_SPEC } from '../shared/application/security/staff-specialization';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';
import { TrainingAssignmentsListQueryDto } from './dto/training-assignments-list-query.dto';
import { TrainingAssignmentsService } from './training-assignments.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('training-assignments')
@UseGuards(BusinessRoleGuard, StaffSpecializationGuard)
@RequireStaffSpecs(STAFF_SPEC.ENTRENADOR)
@BusinessRoles()
export class TrainingAssignmentsController {
  constructor(private readonly assignments: TrainingAssignmentsService) {}

  @Get()
  list(@Req() req: JwtReq, @Query() q: TrainingAssignmentsListQueryDto) {
    return this.assignments.list(
      req.user,
      q.page ?? 1,
      q.pageSize ?? 25,
      q.q,
      q.memberId,
      q.trainerId,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: JwtReq) {
    return this.assignments.getOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateTrainingAssignmentDto, @Req() req: JwtReq) {
    return this.assignments.create(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: JwtReq) {
    return this.assignments.remove(id, req.user);
  }
}

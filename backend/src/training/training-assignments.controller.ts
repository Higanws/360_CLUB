import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';
import { TrainingAssignmentsService } from './training-assignments.service';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('training-assignments')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class TrainingAssignmentsController {
  constructor(private readonly assignments: TrainingAssignmentsService) {}

  @Get()
  list() {
    return this.assignments.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignments.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateTrainingAssignmentDto, @Req() req: JwtReq) {
    return this.assignments.create(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignments.remove(id);
  }
}

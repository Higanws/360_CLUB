import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { CreateTrainingRoutineDto } from './dto/create-training-routine.dto';
import { UpdateTrainingRoutineDto } from './dto/update-training-routine.dto';
import { TrainingRoutinesService } from './training-routines.service';

@Controller('training-routines')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class TrainingRoutinesController {
  constructor(private readonly routines: TrainingRoutinesService) {}

  @Get()
  list() {
    return this.routines.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routines.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateTrainingRoutineDto) {
    return this.routines.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainingRoutineDto,
  ) {
    return this.routines.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.routines.remove(id);
  }
}

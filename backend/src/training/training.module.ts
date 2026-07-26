import { Module } from '@nestjs/common';
import { TrainingAssignmentsController } from './training-assignments.controller';
import { TrainingAssignmentsService } from './training-assignments.service';
import { TrainingRoutinesController } from './training-routines.controller';
import { TrainingRoutinesService } from './training-routines.service';

@Module({
  controllers: [TrainingRoutinesController, TrainingAssignmentsController],
  providers: [TrainingRoutinesService, TrainingAssignmentsService],
})
export class TrainingModule {}

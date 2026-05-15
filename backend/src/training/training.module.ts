import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../entities/activity.entity';
import { GymMember } from '../entities/gym-member.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { TrainingAssignmentMember } from '../entities/training-assignment-member.entity';
import { TrainingAssignmentTrainer } from '../entities/training-assignment-trainer.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { TrainingRoutineActivity } from '../entities/training-routine-activity.entity';
import { TrainingAssignmentsController } from './training-assignments.controller';
import { TrainingAssignmentsService } from './training-assignments.service';
import { TrainingRoutinesController } from './training-routines.controller';
import { TrainingRoutinesService } from './training-routines.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingRoutine,
      TrainingRoutineActivity,
      Activity,
      TrainingAssignment,
      TrainingAssignmentMember,
      TrainingAssignmentTrainer,
      GymMember,
    ]),
  ],
  controllers: [TrainingRoutinesController, TrainingAssignmentsController],
  providers: [TrainingRoutinesService, TrainingAssignmentsService],
})
export class TrainingModule {}

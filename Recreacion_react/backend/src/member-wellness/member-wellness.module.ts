import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MemberWeeklyRoutine } from '../entities/member-weekly-routine.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { MemberWellnessController } from './member-wellness.controller';
import { MemberWellnessService } from './member-wellness.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralSetting,
      GymMember,
      NutritionPlan,
      TrainingAssignment,
      MemberWeeklyRoutine,
    ]),
  ],
  controllers: [MemberWellnessController],
  providers: [MemberWellnessService],
})
export class MemberWellnessModule {}

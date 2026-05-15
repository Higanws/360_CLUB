import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../entities/activity.entity';
import { ActivityCategory } from '../entities/activity-category.entity';
import { ActivityTrainer } from '../entities/activity-trainer.entity';
import { ActivityVideo } from '../entities/activity-video.entity';
import { GymMember } from '../entities/gym-member.entity';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityCategory,
      ActivityVideo,
      ActivityTrainer,
      GymMember,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}

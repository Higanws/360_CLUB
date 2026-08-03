import { Module } from '@nestjs/common';
import { StaffSpecializationGuard } from '../shared/application/security/staff-specialization.guard';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, StaffSpecializationGuard],
})
export class ActivitiesModule {}

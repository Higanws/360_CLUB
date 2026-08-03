import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import { StaffSpecializationGuard } from '../shared/application/security/staff-specialization.guard';

@Module({
  controllers: [AccessControlController],
  providers: [AccessControlService, StaffSpecializationGuard],
})
export class AccessControlModule {}

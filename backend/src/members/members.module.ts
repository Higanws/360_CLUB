import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffSpecializationGuard } from '../shared/application/security/staff-specialization.guard';
import { BusinessRoleGuard } from './business-role.guard';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [AuthModule],
  controllers: [MembersController],
  providers: [MembersService, BusinessRoleGuard, StaffSpecializationGuard],
})
export class MembersModule {}

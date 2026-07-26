import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdministratorRoleGuard } from './administrator-role.guard';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [AuthModule],
  controllers: [StaffController],
  providers: [StaffService, AdministratorRoleGuard],
})
export class StaffModule {}

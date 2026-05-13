import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GymRole } from '../entities/gym-role.entity';
import { GymMember } from '../entities/gym-member.entity';
import { Specialization } from '../entities/specialization.entity';
import { AdministratorRoleGuard } from './administrator-role.guard';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GymMember, GymRole, Specialization]),
    AuthModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, AdministratorRoleGuard],
})
export class StaffModule {}

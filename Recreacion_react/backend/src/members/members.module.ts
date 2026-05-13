import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClassSchedule } from '../entities/class-schedule.entity';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMemberClass } from '../entities/gym-member-class.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
import { BusinessRoleGuard } from './business-role.guard';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymMember,
      GeneralSetting,
      GymMemberClass,
      Membership,
      MembershipPayment,
      ClassSchedule,
    ]),
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService, BusinessRoleGuard],
})
export class MembersModule {}

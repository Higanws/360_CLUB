import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { Membership } from '../entities/membership.entity';
import { MembershipPaymentsController } from './membership-payments.controller';
import { MembershipPaymentsService } from './membership-payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipPayment,
      GymMember,
      Membership,
      GeneralSetting,
    ]),
    AuthModule,
  ],
  controllers: [MembershipPaymentsController],
  providers: [MembershipPaymentsService],
})
export class MembershipPaymentsModule {}

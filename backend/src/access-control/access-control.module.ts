import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubAccessLog } from '../entities/club-access-log.entity';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralSetting,
      GymMember,
      MembershipPayment,
      ClubAccessLog,
    ]),
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
})
export class AccessControlModule {}

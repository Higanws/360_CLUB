import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MembershipPaymentsController } from './membership-payments.controller';
import { MembershipPaymentsService } from './membership-payments.service';

@Module({
  imports: [AuthModule],
  controllers: [MembershipPaymentsController],
  providers: [MembershipPaymentsService],
})
export class MembershipPaymentsModule {}

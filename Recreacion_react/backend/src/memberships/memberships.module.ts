import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../entities/membership.entity';
import { MembershipPayment } from '../entities/membership-payment.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, MembershipPayment])],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}

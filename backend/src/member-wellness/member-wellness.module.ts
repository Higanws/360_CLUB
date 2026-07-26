import { Module } from '@nestjs/common';
import { MemberWellnessController } from './member-wellness.controller';
import { MemberWellnessService } from './member-wellness.service';

@Module({
  controllers: [MemberWellnessController],
  providers: [MemberWellnessService],
})
export class MemberWellnessModule {}

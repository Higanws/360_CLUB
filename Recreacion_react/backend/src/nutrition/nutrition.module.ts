import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GeneralSetting } from '../entities/general-setting.entity';
import { GymMember } from '../entities/gym-member.entity';
import { NutritionPlan } from '../entities/nutrition-plan.entity';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GymMember, NutritionPlan, GeneralSetting]),
    AuthModule,
  ],
  controllers: [NutritionController],
  providers: [NutritionService, BusinessRoleGuard],
})
export class NutritionModule {}

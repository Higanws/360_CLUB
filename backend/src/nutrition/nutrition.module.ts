import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [AuthModule],
  controllers: [NutritionController],
  providers: [NutritionService, BusinessRoleGuard],
})
export class NutritionModule {}

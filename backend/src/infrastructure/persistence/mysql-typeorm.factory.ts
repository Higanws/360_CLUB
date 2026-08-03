import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { GeneralSetting } from '../../entities/general-setting.entity';
import { GymMember } from '../../entities/gym-member.entity';
import { GymRole } from '../../entities/gym-role.entity';
import { MembershipPayment } from '../../entities/membership-payment.entity';
import { Membership } from '../../entities/membership.entity';
import { Activity } from '../../entities/activity.entity';
import { ActivityCategory } from '../../entities/activity-category.entity';
import { ActivityTrainer } from '../../entities/activity-trainer.entity';
import { ActivityVideo } from '../../entities/activity-video.entity';
import { TrainingAssignment } from '../../entities/training-assignment.entity';
import { TrainingAssignmentMember } from '../../entities/training-assignment-member.entity';
import { TrainingAssignmentTrainer } from '../../entities/training-assignment-trainer.entity';
import { TrainingRoutine } from '../../entities/training-routine.entity';
import { TrainingRoutineActivity } from '../../entities/training-routine-activity.entity';
import { NutritionPlan } from '../../entities/nutrition-plan.entity';
import { MemberWeeklyRoutine } from '../../entities/member-weekly-routine.entity';
import { ClubAccessLog } from '../../entities/club-access-log.entity';
import { PosProduct } from '../../entities/pos-product.entity';
import { PosSale } from '../../entities/pos-sale.entity';
import { PosSaleLine } from '../../entities/pos-sale-line.entity';
import { Specialization } from '../../entities/specialization.entity';
import { waitForMysql } from './wait-for-mysql';

/**
 * Adaptador de persistencia (hexagonal): la aplicación habla con MySQL vía TypeORM.
 * Esquema MVP en `backend/database/schema/schema_mysql.sql`. Sin `synchronize`.
 */
export async function createMysqlTypeOrmOptions(
  config: ConfigService,
): Promise<TypeOrmModuleOptions> {
  await waitForMysql(config);
  return {
    type: 'mysql',
    host: config.get<string>('DATABASE_HOST', 'localhost'),
    port: parseInt(config.get<string>('DATABASE_PORT', '3306'), 10),
    username: config.get<string>('DATABASE_USER', 'root'),
    password: config.get<string>('DATABASE_PASSWORD', 'root'),
    database: config.get<string>('DATABASE_NAME', 'club360'),
    charset: 'utf8mb4',
    entities: [
      GymMember,
      GeneralSetting,
      Membership,
      MembershipPayment,
      GymRole,
      Specialization,
      PosProduct,
      PosSale,
      PosSaleLine,
      ActivityCategory,
      Activity,
      ActivityVideo,
      ActivityTrainer,
      TrainingRoutine,
      TrainingRoutineActivity,
      TrainingAssignment,
      TrainingAssignmentMember,
      TrainingAssignmentTrainer,
      NutritionPlan,
      MemberWeeklyRoutine,
      ClubAccessLog,
    ],
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development',
  };
}

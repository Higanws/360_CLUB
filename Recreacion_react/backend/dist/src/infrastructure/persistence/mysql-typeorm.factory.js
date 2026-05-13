"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMysqlTypeOrmOptions = createMysqlTypeOrmOptions;
const class_schedule_entity_1 = require("../../entities/class-schedule.entity");
const general_setting_entity_1 = require("../../entities/general-setting.entity");
const gym_member_class_entity_1 = require("../../entities/gym-member-class.entity");
const gym_member_entity_1 = require("../../entities/gym-member.entity");
const gym_role_entity_1 = require("../../entities/gym-role.entity");
const membership_payment_entity_1 = require("../../entities/membership-payment.entity");
const membership_entity_1 = require("../../entities/membership.entity");
const activity_entity_1 = require("../../entities/activity.entity");
const activity_category_entity_1 = require("../../entities/activity-category.entity");
const activity_trainer_entity_1 = require("../../entities/activity-trainer.entity");
const activity_video_entity_1 = require("../../entities/activity-video.entity");
const training_assignment_entity_1 = require("../../entities/training-assignment.entity");
const training_assignment_member_entity_1 = require("../../entities/training-assignment-member.entity");
const training_assignment_trainer_entity_1 = require("../../entities/training-assignment-trainer.entity");
const training_routine_entity_1 = require("../../entities/training-routine.entity");
const training_routine_activity_entity_1 = require("../../entities/training-routine-activity.entity");
const nutrition_plan_entity_1 = require("../../entities/nutrition-plan.entity");
const member_weekly_routine_entity_1 = require("../../entities/member-weekly-routine.entity");
const club_access_log_entity_1 = require("../../entities/club-access-log.entity");
const pos_product_entity_1 = require("../../entities/pos-product.entity");
const pos_sale_entity_1 = require("../../entities/pos-sale.entity");
const pos_sale_line_entity_1 = require("../../entities/pos-sale-line.entity");
const specialization_entity_1 = require("../../entities/specialization.entity");
const wait_for_mysql_1 = require("../../wait-for-mysql");
async function createMysqlTypeOrmOptions(config) {
    await (0, wait_for_mysql_1.waitForMysql)(config);
    return {
        type: 'mysql',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: parseInt(config.get('DATABASE_PORT', '3306'), 10),
        username: config.get('DATABASE_USER', 'root'),
        password: config.get('DATABASE_PASSWORD', 'root'),
        database: config.get('DATABASE_NAME', 'club360'),
        charset: 'utf8mb4',
        entities: [
            gym_member_entity_1.GymMember,
            general_setting_entity_1.GeneralSetting,
            membership_entity_1.Membership,
            class_schedule_entity_1.ClassSchedule,
            gym_member_class_entity_1.GymMemberClass,
            membership_payment_entity_1.MembershipPayment,
            gym_role_entity_1.GymRole,
            specialization_entity_1.Specialization,
            pos_product_entity_1.PosProduct,
            pos_sale_entity_1.PosSale,
            pos_sale_line_entity_1.PosSaleLine,
            activity_category_entity_1.ActivityCategory,
            activity_entity_1.Activity,
            activity_video_entity_1.ActivityVideo,
            activity_trainer_entity_1.ActivityTrainer,
            training_routine_entity_1.TrainingRoutine,
            training_routine_activity_entity_1.TrainingRoutineActivity,
            training_assignment_entity_1.TrainingAssignment,
            training_assignment_member_entity_1.TrainingAssignmentMember,
            training_assignment_trainer_entity_1.TrainingAssignmentTrainer,
            nutrition_plan_entity_1.NutritionPlan,
            member_weekly_routine_entity_1.MemberWeeklyRoutine,
            club_access_log_entity_1.ClubAccessLog,
        ],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
    };
}
//# sourceMappingURL=mysql-typeorm.factory.js.map
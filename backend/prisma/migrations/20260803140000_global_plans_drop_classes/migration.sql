-- Drop legacy "Clases" (Spinning / class schedule)
DROP TABLE IF EXISTS `gym_member_class`;
DROP TABLE IF EXISTS `class_schedule`;

-- Member subscription flags to club-wide general plans
ALTER TABLE `gym_member`
  ADD COLUMN `subscribe_nutrition_general` TINYINT NOT NULL DEFAULT 1,
  ADD COLUMN `subscribe_training_general` TINYINT NOT NULL DEFAULT 1;

-- General training routines
ALTER TABLE `training_routine`
  ADD COLUMN `is_general` TINYINT NOT NULL DEFAULT 0;
CREATE INDEX `idx_training_routine_general` ON `training_routine`(`is_general`);

-- Club-wide nutrition plan (single source of truth)
CREATE TABLE `nutrition_plan_general` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL DEFAULT 'Dieta general',
  `is_published` TINYINT NOT NULL DEFAULT 1,
  `valid_from` DATE NULL,
  `valid_to` DATE NULL,
  `meals_schedule_json` LONGTEXT NULL,
  `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `idx_nutrition_plan_general_published` ON `nutrition_plan_general`(`is_published`);

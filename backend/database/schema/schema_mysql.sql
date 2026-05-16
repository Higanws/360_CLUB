-- Club360 MVP — esquema SQL (`backend/database/schema/`).
-- Espejo de `backend/prisma/schema.prisma`. Si cambias tablas: Prisma + entidades + este archivo.
-- Datos demo: solo en `backend/database/seed/seed_mvp.sql` (no duplicar INSERTs aquí).
--
-- Uso manual:
--   mysql -u root -p club360 < backend/database/schema/schema_mysql.sql
--   mysql -u root -p club360 < backend/database/seed/seed_mvp.sql
--
-- Primera vez (sin tablas): comenta la sección «Vaciado» o usa solo el bloque «Esquema».
-- Reset: archivo completo + seed, o `cd backend && npm run db:seed`.
--
-- Wizard: DROP total → solo bloque «Esquema» → seed_mvp.sql.

SET NAMES utf8mb4;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- =============================================================================
-- Vaciado — solo si las tablas MVP ya existen (omitir en instalación nueva)
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `nutrition_plan`;
TRUNCATE TABLE `member_weekly_routine`;
TRUNCATE TABLE `training_assignment_trainer`;
TRUNCATE TABLE `training_assignment_member`;
TRUNCATE TABLE `training_assignment`;
TRUNCATE TABLE `training_routine_activity`;
TRUNCATE TABLE `activity_trainer`;
TRUNCATE TABLE `activity_video`;
TRUNCATE TABLE `activity`;
TRUNCATE TABLE `activity_category`;
TRUNCATE TABLE `pos_sale_line`;
TRUNCATE TABLE `pos_sale`;
TRUNCATE TABLE `pos_product`;
TRUNCATE TABLE `membership_payment`;
TRUNCATE TABLE `gym_member_class`;
TRUNCATE TABLE `club_access_log`;
TRUNCATE TABLE `gym_member`;
TRUNCATE TABLE `training_routine`;
TRUNCATE TABLE `membership`;
TRUNCATE TABLE `class_schedule`;
TRUNCATE TABLE `general_setting`;
TRUNCATE TABLE `gym_roles`;
TRUNCATE TABLE `specialization`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Esquema — CREATE TABLE IF NOT EXISTS (24 tablas MVP)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `general_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `gym_logo` varchar(200) DEFAULT NULL,
  `left_header` varchar(100) DEFAULT NULL,
  `footer` varchar(100) DEFAULT NULL,
  `header_color` varchar(10) DEFAULT NULL,
  `currency` varchar(20) DEFAULT NULL,
  `member_can_view_other` int DEFAULT NULL,
  `staff_can_view_own_member` int DEFAULT NULL,
  `date_format` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gym_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `specialization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `membership` (
  `id` int NOT NULL AUTO_INCREMENT,
  `membership_label` varchar(100) DEFAULT NULL,
  `membership_amount` double DEFAULT NULL,
  `membership_period_days` int DEFAULT NULL,
  `installment_plan` varchar(100) DEFAULT NULL,
  `signup_fee` double DEFAULT NULL,
  `description` text,
  `image` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `class_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gym_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activated` int DEFAULT NULL,
  `role_name` text,
  `member_id` text,
  `di_dni_type` varchar(10) DEFAULT NULL,
  `di_dni_number` varchar(30) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `member_type` text,
  `role` int DEFAULT NULL,
  `s_specialization` text,
  `gender` text,
  `birth_date` date DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `zipcode` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `image` varchar(200) DEFAULT NULL,
  `assign_staff_mem` int DEFAULT NULL,
  `intrested_area` int DEFAULT NULL,
  `g_source` int DEFAULT NULL,
  `referrer_by` int DEFAULT NULL,
  `inquiry_date` date DEFAULT NULL,
  `trial_end_date` date DEFAULT NULL,
  `selected_membership` varchar(100) DEFAULT NULL,
  `membership_status` text,
  `membership_valid_from` date DEFAULT NULL,
  `membership_valid_to` date DEFAULT NULL,
  `first_pay_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `physical_weight_kg` decimal(10,2) DEFAULT NULL,
  `physical_height_cm` decimal(10,2) DEFAULT NULL,
  `physical_chest_cm` decimal(10,2) DEFAULT NULL,
  `physical_waist_cm` decimal(10,2) DEFAULT NULL,
  `physical_thigh_cm` decimal(10,2) DEFAULT NULL,
  `physical_arms_cm` decimal(10,2) DEFAULT NULL,
  `physical_fat_percent` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gym_member_class` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int DEFAULT NULL,
  `assign_class` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gym_member_class_member` (`member_id`),
  KEY `idx_gym_member_class_assign` (`assign_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `membership_payment` (
  `mp_id` int NOT NULL AUTO_INCREMENT,
  `member_id` int DEFAULT NULL,
  `membership_id` int DEFAULT NULL,
  `membership_amount` double DEFAULT NULL,
  `paid_amount` double DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `membership_status` varchar(50) DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`mp_id`),
  KEY `idx_membership_payment_member` (`member_id`),
  KEY `idx_membership_payment_plan` (`membership_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pos_product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(64) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `unit_price` double NOT NULL DEFAULT 0,
  `stock_qty` int NOT NULL DEFAULT 0,
  `active` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pos_product_active` (`active`),
  KEY `idx_pos_product_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pos_sale` (
  `id` int NOT NULL AUTO_INCREMENT,
  `total_amount` double NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `payment_method` varchar(32) NOT NULL DEFAULT 'efectivo',
  PRIMARY KEY (`id`),
  KEY `idx_pos_sale_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pos_sale_line` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` int NOT NULL,
  `unit_price` double NOT NULL,
  `line_total` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pos_sale_line_sale` (`sale_id`),
  KEY `idx_pos_sale_line_product` (`product_id`),
  CONSTRAINT `fk_pos_sale_line_sale` FOREIGN KEY (`sale_id`) REFERENCES `pos_sale` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pos_sale_line_product` FOREIGN KEY (`product_id`) REFERENCES `pos_product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `difficulty_level` varchar(20) NOT NULL DEFAULT 'media',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_category` (`category_id`),
  CONSTRAINT `fk_activity_category` FOREIGN KEY (`category_id`) REFERENCES `activity_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_video` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `url` varchar(800) NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_activity_video_activity` (`activity_id`),
  CONSTRAINT `fk_activity_video_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_trainer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NOT NULL,
  `trainer_member_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_trainer` (`activity_id`, `trainer_member_id`),
  KEY `idx_activity_trainer_member` (`trainer_member_id`),
  CONSTRAINT `fk_activity_trainer_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_trainer_member` FOREIGN KEY (`trainer_member_id`) REFERENCES `gym_member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_routine` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `difficulty_level` varchar(20) NOT NULL DEFAULT 'media',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_routine_activity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `routine_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `weight_kg` double DEFAULT NULL,
  `weekdays_mask` tinyint unsigned NOT NULL DEFAULT 127 COMMENT 'Bitmask Lun-Dom: 1,2,4,8,16,32,64',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_training_routine_activity` (`routine_id`, `activity_id`),
  KEY `idx_tra_routine` (`routine_id`),
  KEY `idx_tra_activity` (`activity_id`),
  CONSTRAINT `fk_tra_routine` FOREIGN KEY (`routine_id`) REFERENCES `training_routine` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tra_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_assignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `routine_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tas_routine` (`routine_id`),
  CONSTRAINT `fk_tas_routine` FOREIGN KEY (`routine_id`) REFERENCES `training_routine` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_assignment_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `member_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tam` (`assignment_id`, `member_id`),
  KEY `idx_tam_member` (`member_id`),
  CONSTRAINT `fk_tam_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `training_assignment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tam_member` FOREIGN KEY (`member_id`) REFERENCES `gym_member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_assignment_trainer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `trainer_member_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tat` (`assignment_id`, `trainer_member_id`),
  KEY `idx_tat_trainer` (`trainer_member_id`),
  CONSTRAINT `fk_tat_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `training_assignment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tat_trainer` FOREIGN KEY (`trainer_member_id`) REFERENCES `gym_member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `nutrition_plan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `meals_schedule_json` longtext DEFAULT NULL COMMENT 'JSON [{weekday,hour,event,dish?,ingredients?[{name,qty}]}]',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nutrition_plan_member` (`member_id`),
  CONSTRAINT `fk_nutrition_plan_member` FOREIGN KEY (`member_id`) REFERENCES `gym_member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `member_weekly_routine` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `week_start` date NOT NULL COMMENT 'Lunes Europe/Madrid (YYYY-MM-DD)',
  `routine_snapshot_json` longtext DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_weekly_routine_member_id_week_start_key` (`member_id`, `week_start`),
  CONSTRAINT `fk_member_weekly_routine_member` FOREIGN KEY (`member_id`) REFERENCES `gym_member` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `club_access_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int DEFAULT NULL,
  `access_date` date NOT NULL COMMENT 'Día de negocio Europe/Madrid (YYYY-MM-DD)',
  `access_at` datetime NOT NULL,
  `staff_actor_id` int NOT NULL,
  `outcome` varchar(40) NOT NULL,
  `status_display` varchar(40) DEFAULT NULL,
  `lookup_raw` varchar(160) DEFAULT NULL,
  `due_date_snapshot` date DEFAULT NULL,
  `days_remaining` int DEFAULT NULL,
  `days_overdue` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cal_member_date` (`member_id`, `access_date`),
  KEY `idx_cal_staff` (`staff_actor_id`),
  CONSTRAINT `fk_cal_member` FOREIGN KEY (`member_id`) REFERENCES `gym_member` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cal_staff` FOREIGN KEY (`staff_actor_id`) REFERENCES `gym_member` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

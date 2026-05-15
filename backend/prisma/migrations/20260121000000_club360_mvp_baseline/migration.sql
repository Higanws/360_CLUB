-- Baseline único Club360 MVP: esquema + datos demo (socios, staff, ejercicios, rutina, POS, accesos, etc.).
-- El asistente hace DROP de todas las tablas, comprueba que queden 0 tablas y ejecuta `prisma migrate deploy` solo sobre esta migración.

-- CreateTable
CREATE TABLE `general_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,
    `gym_logo` VARCHAR(200) NULL,
    `left_header` VARCHAR(100) NULL,
    `footer` VARCHAR(100) NULL,
    `header_color` VARCHAR(10) NULL,
    `currency` VARCHAR(20) NULL,
    `member_can_view_other` INTEGER NULL,
    `staff_can_view_own_member` INTEGER NULL,
    `date_format` VARCHAR(15) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gym_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membership` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `membership_label` VARCHAR(100) NULL,
    `membership_amount` DOUBLE NULL,
    `membership_period_days` INTEGER NULL,
    `installment_plan` VARCHAR(100) NULL,
    `signup_fee` DOUBLE NULL,
    `description` TEXT NULL,
    `image` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_name` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gym_member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activated` INTEGER NULL,
    `role_name` TEXT NULL,
    `member_id` TEXT NULL,
    `di_dni_type` VARCHAR(10) NULL,
    `di_dni_number` VARCHAR(30) NULL,
    `first_name` VARCHAR(100) NULL,
    `middle_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `member_type` TEXT NULL,
    `role` INTEGER NULL,
    `s_specialization` TEXT NULL,
    `gender` TEXT NULL,
    `birth_date` DATE NULL,
    `address` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `zipcode` VARCHAR(100) NULL,
    `mobile` VARCHAR(20) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `username` VARCHAR(100) NULL,
    `password` VARCHAR(255) NULL,
    `image` VARCHAR(200) NULL,
    `assign_staff_mem` INTEGER NULL,
    `intrested_area` INTEGER NULL,
    `g_source` INTEGER NULL,
    `referrer_by` INTEGER NULL,
    `inquiry_date` DATE NULL,
    `trial_end_date` DATE NULL,
    `selected_membership` VARCHAR(100) NULL,
    `membership_status` TEXT NULL,
    `membership_valid_from` DATE NULL,
    `membership_valid_to` DATE NULL,
    `first_pay_date` DATE NULL,
    `created_by` INTEGER NULL,
    `created_date` DATE NULL,
    `physical_weight_kg` DECIMAL(10, 2) NULL,
    `physical_height_cm` DECIMAL(10, 2) NULL,
    `physical_chest_cm` DECIMAL(10, 2) NULL,
    `physical_waist_cm` DECIMAL(10, 2) NULL,
    `physical_thigh_cm` DECIMAL(10, 2) NULL,
    `physical_arms_cm` DECIMAL(10, 2) NULL,
    `physical_fat_percent` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gym_member_class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NULL,
    `assign_class` INTEGER NULL,

    INDEX `idx_gym_member_class_member`(`member_id`),
    INDEX `idx_gym_member_class_assign`(`assign_class`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membership_payment` (
    `mp_id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NULL,
    `membership_id` INTEGER NULL,
    `membership_amount` DOUBLE NULL,
    `paid_amount` DOUBLE NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `membership_status` VARCHAR(50) NULL,
    `payment_status` VARCHAR(20) NULL,
    `created_date` DATE NULL,
    `created_by` INTEGER NULL,

    INDEX `idx_membership_payment_member`(`member_id`),
    INDEX `idx_membership_payment_plan`(`membership_id`),
    PRIMARY KEY (`mp_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(64) NULL,
    `name` VARCHAR(200) NOT NULL,
    `unit_price` DOUBLE NOT NULL DEFAULT 0,
    `stock_qty` INTEGER NOT NULL DEFAULT 0,
    `active` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_pos_product_active`(`active`),
    INDEX `idx_pos_product_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_sale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `total_amount` DOUBLE NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NULL,
    `payment_method` VARCHAR(32) NOT NULL DEFAULT 'efectivo',

    INDEX `idx_pos_sale_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_sale_line` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL,
    `unit_price` DOUBLE NOT NULL,
    `line_total` DOUBLE NOT NULL,

    INDEX `idx_pos_sale_line_sale`(`sale_id`),
    INDEX `idx_pos_sale_line_product`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `difficulty_level` VARCHAR(20) NOT NULL DEFAULT 'media',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_activity_category`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_video` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `url` VARCHAR(800) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `idx_activity_video_activity`(`activity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_trainer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER NOT NULL,
    `trainer_member_id` INTEGER NOT NULL,

    INDEX `idx_activity_trainer_member`(`trainer_member_id`),
    UNIQUE INDEX `uk_activity_trainer`(`activity_id`, `trainer_member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_routine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `difficulty_level` VARCHAR(20) NOT NULL DEFAULT 'media',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_routine_activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routine_id` INTEGER NOT NULL,
    `activity_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `weight_kg` DOUBLE NULL,
    `weekdays_mask` TINYINT UNSIGNED NOT NULL DEFAULT 127,

    INDEX `idx_tra_routine`(`routine_id`),
    INDEX `idx_tra_activity`(`activity_id`),
    UNIQUE INDEX `uk_training_routine_activity`(`routine_id`, `activity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routine_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_tas_routine`(`routine_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_assignment_member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignment_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,

    INDEX `idx_tam_member`(`member_id`),
    UNIQUE INDEX `uk_tam`(`assignment_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_assignment_trainer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignment_id` INTEGER NOT NULL,
    `trainer_member_id` INTEGER NOT NULL,

    INDEX `idx_tat_trainer`(`trainer_member_id`),
    UNIQUE INDEX `uk_tat`(`assignment_id`, `trainer_member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nutrition_plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `valid_from` DATE NULL,
    `valid_to` DATE NULL,
    `meals_schedule_json` LONGTEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `nutrition_plan_member_id_key`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
-- `week_start`: lunes (DATE) según calendario Europe/Madrid (ver API member-wellness).
CREATE TABLE `member_weekly_routine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `week_start` DATE NOT NULL,
    `routine_snapshot_json` LONGTEXT NULL,
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `member_weekly_routine_member_id_week_start_key`(`member_id`, `week_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `club_access_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NULL,
    `access_date` DATE NOT NULL,
    `access_at` DATETIME(0) NOT NULL,
    `staff_actor_id` INTEGER NOT NULL,
    `outcome` VARCHAR(40) NOT NULL,
    `status_display` VARCHAR(40) NULL,
    `lookup_raw` VARCHAR(160) NULL,
    `due_date_snapshot` DATE NULL,
    `days_remaining` INTEGER NULL,
    `days_overdue` INTEGER NULL,

    INDEX `idx_cal_member_date`(`member_id`, `access_date`),
    INDEX `idx_cal_staff`(`staff_actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pos_sale_line` ADD CONSTRAINT `pos_sale_line_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `pos_sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sale_line` ADD CONSTRAINT `pos_sale_line_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `pos_product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity` ADD CONSTRAINT `activity_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `activity_category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_video` ADD CONSTRAINT `activity_video_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_trainer` ADD CONSTRAINT `activity_trainer_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_trainer` ADD CONSTRAINT `activity_trainer_trainer_member_id_fkey` FOREIGN KEY (`trainer_member_id`) REFERENCES `gym_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_routine_activity` ADD CONSTRAINT `training_routine_activity_routine_id_fkey` FOREIGN KEY (`routine_id`) REFERENCES `training_routine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_routine_activity` ADD CONSTRAINT `training_routine_activity_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_assignment` ADD CONSTRAINT `training_assignment_routine_id_fkey` FOREIGN KEY (`routine_id`) REFERENCES `training_routine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_assignment_member` ADD CONSTRAINT `training_assignment_member_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `training_assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_assignment_member` ADD CONSTRAINT `training_assignment_member_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `gym_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_assignment_trainer` ADD CONSTRAINT `training_assignment_trainer_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `training_assignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_assignment_trainer` ADD CONSTRAINT `training_assignment_trainer_trainer_member_id_fkey` FOREIGN KEY (`trainer_member_id`) REFERENCES `gym_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutrition_plan` ADD CONSTRAINT `nutrition_plan_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `gym_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_weekly_routine` ADD CONSTRAINT `member_weekly_routine_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `gym_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_access_log` ADD CONSTRAINT `club_access_log_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `gym_member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_access_log` ADD CONSTRAINT `club_access_log_staff_actor_id_fkey` FOREIGN KEY (`staff_actor_id`) REFERENCES `gym_member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Datos demo (misma semilla que antes en seed_mvp_mysql.sql + módulos extra)
-- Contraseña demo socios: member123 (usuario ana_member / luis_member).
-- Admin y staff: placeholders bcrypt; el wizard sobrescribe admin id=1.
-- ---------------------------------------------------------------------------
SET NAMES utf8mb4;

INSERT INTO `general_setting` (
  `id`, `name`, `gym_logo`, `left_header`, `footer`, `header_color`, `currency`,
  `member_can_view_other`, `staff_can_view_own_member`, `date_format`
) VALUES (
  1, 'Club360', NULL, 'Club360', '', '#27272a', 'ARS', 0, 0, 'd/m/Y'
);

INSERT INTO `gym_roles` (`id`, `name`) VALUES (1, 'General');
INSERT INTO `specialization` (`id`, `name`) VALUES (1, 'General');

INSERT INTO `membership` (
  `id`, `membership_label`, `membership_amount`, `membership_period_days`, `installment_plan`, `signup_fee`
) VALUES
(1, 'Plan básico', 49, 30, '1 mes', 5),
(2, 'Plan completo', 79, 30, '1 mes', 5);

INSERT INTO `class_schedule` (`id`, `class_name`) VALUES (1, 'Spinning 09:00');

INSERT INTO `gym_member` (
  `id`, `activated`, `role_name`, `member_id`, `first_name`, `middle_name`, `last_name`,
  `username`, `password`, `email`, `role`, `gender`, `created_date`, `assign_staff_mem`
) VALUES
(
  1, 1, 'administrator', NULL, 'Admin', '', 'Club360',
  'admin',
  '$2b$10$am//pywdU8mUGWXufZglo.MbjgjiMX22hNdU5a1K93sFXb8BOkGJm',
  'admin@local.test', NULL, NULL, CURDATE(), NULL
),
(
  2, 1, 'staff_member', NULL, 'Staff', '', 'Demo',
  'staff',
  '$2b$10$zZfG6sfkoUx.dje.EOcnSenNHULqb4zqQ3FS/Sn8JQfEH8oTYkO1a',
  'staff@local.test', 1, 'male', CURDATE(), NULL
),
(
  3, 1, 'member', '2024001', 'Ana', '', 'García',
  'ana_member',
  '$2b$10$VUJLd1DP3..rc6C3ilaQAuunh1oqnRdLpHYzZn6l5PGXOhee9vkoO',
  'ana@demo.local', NULL, 'female', CURDATE(), 2
),
(
  4, 1, 'member', '2024002', 'Luis', '', 'Martín',
  'luis_member',
  '$2b$10$VUJLd1DP3..rc6C3ilaQAuunh1oqnRdLpHYzZn6l5PGXOhee9vkoO',
  'luis@demo.local', NULL, 'male', CURDATE(), 2
);

INSERT INTO `activity_category` (`id`, `name`) VALUES (1, 'Fuerza');

INSERT INTO `activity` (`id`, `category_id`, `title`, `description`, `difficulty_level`) VALUES
(1, 1, 'Press banca', 'Press plano en banco', 'media'),
(2, 1, 'Remo con mancuerna', 'Unilateral', 'media');

INSERT INTO `activity_video` (`id`, `activity_id`, `url`, `sort_order`) VALUES
(1, 1, 'https://example.com/videos/press-banca-demo.mp4', 0);

INSERT INTO `activity_trainer` (`id`, `activity_id`, `trainer_member_id`) VALUES
(1, 1, 2),
(2, 2, 2);

INSERT INTO `training_routine` (`id`, `title`, `description`, `difficulty_level`) VALUES
(1, 'Rutina demo 4 días', 'Ejemplo para asignaciones y portal socio', 'media');

INSERT INTO `training_routine_activity` (`id`, `routine_id`, `activity_id`, `sort_order`, `weight_kg`, `weekdays_mask`) VALUES
(1, 1, 1, 0, 40, 127),
(2, 1, 2, 1, 16, 127);

INSERT INTO `training_assignment` (`id`, `routine_id`) VALUES (1, 1);

INSERT INTO `training_assignment_member` (`id`, `assignment_id`, `member_id`) VALUES (1, 1, 3);
INSERT INTO `training_assignment_trainer` (`id`, `assignment_id`, `trainer_member_id`) VALUES (1, 1, 2);

INSERT INTO `pos_product` (`id`, `sku`, `name`, `unit_price`, `stock_qty`, `active`) VALUES
(1, 'SKU-BEB', 'Bebida isotónica', 2.5, 48, 1),
(2, 'SKU-TOA', 'Toalla club', 8, 15, 1);

INSERT INTO `pos_sale` (`id`, `total_amount`, `created_by`, `payment_method`) VALUES
(1, 12.5, 2, 'efectivo');

INSERT INTO `pos_sale_line` (`id`, `sale_id`, `product_id`, `qty`, `unit_price`, `line_total`) VALUES
(1, 1, 1, 5, 2.5, 12.5);

INSERT INTO `membership_payment` (
  `mp_id`, `member_id`, `membership_id`, `membership_amount`, `paid_amount`,
  `start_date`, `end_date`, `membership_status`, `payment_status`, `created_date`, `created_by`
) VALUES (
  1, 3, 1, 49, 25, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Continue', '0', CURDATE(), 2
);

INSERT INTO `nutrition_plan` (`id`, `member_id`, `valid_from`, `valid_to`, `meals_schedule_json`) VALUES
(1, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), NULL);

INSERT INTO `member_weekly_routine` (`id`, `member_id`, `week_start`, `routine_snapshot_json`) VALUES (
  1, 3, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), NULL
);

INSERT INTO `club_access_log` (
  `id`, `member_id`, `access_date`, `access_at`, `staff_actor_id`, `outcome`, `status_display`, `lookup_raw`,
  `due_date_snapshot`, `days_remaining`, `days_overdue`
) VALUES
(
  1, 3, CURDATE(), NOW(), 2, 'allowed', 'OK', '2024001', NULL, 10, NULL
),
(
  2, NULL, CURDATE(), NOW(), 2, 'denied_not_found', NULL, '99999', NULL, NULL, NULL
);


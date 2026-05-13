-- Baseline único Club360 MVP: esquema completo alineado con `schema.prisma`.
-- Tras vaciar la base, `prisma migrate deploy` aplica solo esta migración; los datos demo van en `database/seed/seed_mvp_mysql.sql`.

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


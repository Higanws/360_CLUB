-- AlterTable: club_access_log (instalaciones existentes; idempotente si ya existe la tabla)

CREATE TABLE IF NOT EXISTS `club_access_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NULL,
  `access_date` date NOT NULL,
  `access_at` datetime NOT NULL,
  `staff_actor_id` int NOT NULL,
  `outcome` varchar(40) NOT NULL,
  `status_display` varchar(40) NULL,
  `lookup_raw` varchar(160) NULL,
  `due_date_snapshot` date NULL,
  `days_remaining` int NULL,
  `days_overdue` int NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_cal_member_date` (`member_id`, `access_date`),
  INDEX `idx_cal_staff` (`staff_actor_id`),
  CONSTRAINT `fk_cal_member` FOREIGN KEY (`member_id`) REFERENCES `gym_member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cal_staff` FOREIGN KEY (`staff_actor_id`) REFERENCES `gym_member` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

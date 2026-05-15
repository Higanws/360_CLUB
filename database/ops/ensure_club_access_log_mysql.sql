-- Bases creadas antes de incluir control de acceso (log de recepción).
-- Ejecutar sobre la base del club: USE `club360`; luego este script.
-- Idempotente: CREATE TABLE IF NOT EXISTS.

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

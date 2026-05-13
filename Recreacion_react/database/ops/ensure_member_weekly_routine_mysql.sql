-- Reparación para bases creadas antes de incluir rutina semanal del socio en el esquema MVP.
-- Ejecutar en DBeaver (o mysql.exe) sobre la base del club, p. ej. USE `360_test`;
-- Es idempotente: IF NOT EXISTS.

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

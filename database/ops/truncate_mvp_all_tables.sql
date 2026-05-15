-- Vaciado manual de todas las tablas MVP (mismo orden que el instalador).
-- Opcion A — indicar base en la linea de comandos:
--   mysql -h 127.0.0.1 -P 3306 -u root -proot club360 < database/ops/truncate_mvp_all_tables.sql
-- Opcion B — cambia el nombre abajo y ejecuta desde cualquier cliente SQL:

SET NAMES utf8mb4;
USE `club360`;
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

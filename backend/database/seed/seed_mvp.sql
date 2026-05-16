-- Club360 MVP — datos de prueba (única fuente de INSERTs demo).
-- Ejecutar tras el DDL en database/schema/schema_mysql.sql (wizard, npm run db:seed).
--
-- Índices de listado / login en `gym_member`: definidos en schema_mysql.sql (CREATE TABLE).
-- Bases antiguas: ALTER comentados al final de schema_mysql.sql o en docs/escalabilidad-y-operacion.md
--
-- Contraseñas (bcrypt):
--   admin     → admin      (el wizard sobrescribe id=1 con la del asistente)
--   staff     → staff
--   ana_member / luis_member → member123
-- Vídeos demo: activity_video usa YouTube (ej. v=TAH8RxOS0VI) para iframes en portal y gestión.

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
(1, 1, 'https://www.youtube.com/watch?v=TAH8RxOS0VI', 0),
(2, 2, 'https://www.youtube.com/watch?v=TAH8RxOS0VI', 0);

INSERT INTO `activity_trainer` (`id`, `activity_id`, `trainer_member_id`) VALUES
(1, 1, 2),
(2, 2, 2);

INSERT INTO `training_routine` (`id`, `title`, `description`, `difficulty_level`) VALUES
(1, 'Rutina demo 4 días', 'Ejemplo para asignaciones y portal socio', 'media');

INSERT INTO `training_routine_activity` (`id`, `routine_id`, `activity_id`, `sort_order`, `weight_kg`, `weekdays_mask`) VALUES
(1, 1, 1, 0, 40, 127),
(2, 1, 2, 1, 16, 127);

INSERT INTO `training_assignment` (`id`, `routine_id`) VALUES
(1, 1),
(2, 1);

INSERT INTO `training_assignment_member` (`id`, `assignment_id`, `member_id`) VALUES
(1, 1, 3),
(2, 2, 4);

INSERT INTO `training_assignment_trainer` (`id`, `assignment_id`, `trainer_member_id`) VALUES
(1, 1, 2),
(2, 2, 2);

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
) VALUES
(
  1, 3, 1, 49, 25, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Continue', '0', CURDATE(), 2
),
(
  2, 4, 1, 49, 49, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Continue', '1', CURDATE(), 2
);

INSERT INTO `nutrition_plan` (`id`, `member_id`, `valid_from`, `valid_to`, `meals_schedule_json`) VALUES
(1, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), NULL),
(
  2, 4, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY),
  '[{"weekday":1,"hour":8,"event":"Desayuno proteico","dish":"Bowl de yogur griego con avena y frutos rojos.","ingredients":[{"name":"Yogur griego natural","quantity":"200 g"},{"name":"Avena en hojuelas","quantity":"40 g"},{"name":"Arándanos congelados","quantity":"50 g"}]},{"weekday":1,"hour":13,"event":"Almuerzo balanceado","dish":"Ensalada de pollo a la plancha con quinoa y aguacate.","ingredients":[{"name":"Pechuga de pollo","quantity":"150 g"},{"name":"Quinoa cocida","quantity":"80 g"},{"name":"Aguacate","quantity":"60 g"},{"name":"Mix de hojas verdes","quantity":"100 g"}]},{"weekday":1,"hour":20,"event":"Cena ligera","dish":"Sopa de verduras casera con huevo.","ingredients":[{"name":"Caldo de verduras","quantity":"350 ml"},{"name":"Huevo","quantity":"1 unidad"},{"name":"Verduras mixtas","quantity":"150 g"}]},{"weekday":3,"hour":8,"event":"Desayuno"},{"weekday":5,"hour":13,"event":"Almuerzo pre-entreno"}]'
);

INSERT INTO `member_weekly_routine` (`id`, `member_id`, `week_start`, `routine_snapshot_json`) VALUES
(
  1, 3, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), NULL
),
(
  2, 4, DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), NULL
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

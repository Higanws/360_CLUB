-- Datos iniciales Club360 MVP (Nest). No depende de PHP_version ni dumps legacy.
-- Equivalente TypeScript: `backend/prisma/seed.ts` (npm run db:seed en backend).-- Contraseñas demo tras instalación: admin y staff definidas en el wizard (admin id=1);
-- staff puede iniciar con usuario «staff» / «staff» hasta que lo cambies.
SET NAMES utf8mb4;

INSERT INTO general_setting (
  id, name, gym_logo, left_header, footer, header_color, currency,
  member_can_view_other, staff_can_view_own_member, date_format
) VALUES (
  1,
  'Club360',
  NULL,
  'Club360',
  '',
  '#27272a',
  'EUR',
  0,
  0,
  'd/m/Y'
);

INSERT INTO gym_roles (id, name) VALUES (1, 'General');

INSERT INTO specialization (id, name) VALUES (1, 'General');

INSERT INTO membership (
  id,
  membership_label,
  membership_amount,
  membership_period_days,
  installment_plan,
  signup_fee
) VALUES
(1, 'Plan básico', 49, 30, '1 mes', 5),
(2, 'Plan completo', 79, 30, '1 mes', 5);

INSERT INTO gym_member (
  id,
  activated,
  role_name,
  first_name,
  middle_name,
  last_name,
  username,
  password,
  email,
  role,
  gender,
  created_date
) VALUES
(
  1,
  1,
  'administrator',
  'Admin',
  '',
  'Club360',
  'admin',
  '$2b$10$am//pywdU8mUGWXufZglo.MbjgjiMX22hNdU5a1K93sFXb8BOkGJm',
  'admin@local.test',
  NULL,
  NULL,
  CURDATE()
),
(
  2,
  1,
  'staff_member',
  'Staff',
  '',
  'Demo',
  'staff',
  '$2b$10$zZfG6sfkoUx.dje.EOcnSenNHULqb4zqQ3FS/Sn8JQfEH8oTYkO1a',
  'staff@local.test',
  1,
  'male',
  CURDATE()
);

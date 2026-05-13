-- =============================================================================
-- MariaDB en Windows + Node.js (mysql2 / Nest): error «auth_gssapi_client» /
-- «unknown plugin auth_gssapi»
--
-- Causa habitual (p. ej. MariaDB 12.x): en mysql.global_priv la cuenta root tiene
-- además de mysql_native_password un «auth_or» con plugin «gssapi». El cliente
-- oficial «mysql» lo acepta; Node.js no implementa ese plugin y falla.
--
-- Solución: redefinir la contraseña con IDENTIFIED BY para cada fila root que
-- tengas; eso regenera el JSON sin auth_or. Ejecuta TODO el script con un cliente
-- que ya pueda entrar (mysql.exe, HeidiSQL, etc.).
--
-- Antes, lista hosts de root:
--   SELECT User, Host FROM mysql.user WHERE User = 'root';
-- Repite ALTER para cada Host que aparezca (añade líneas si tienes root@'%', etc.).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS club360
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS 360_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Quitar el camino GSSAPI en cuentas root (obligatorio para mysql2 en Node).
ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED BY 'root';
ALTER USER IF EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root';
ALTER USER IF EXISTS 'root'@'::1' IDENTIFIED BY 'root';

-- Si aparece una fila root@'NOMBRE-DE-TU-PC' al listar mysql.user, descomenta y ajusta:
-- ALTER USER IF EXISTS 'root'@'TU_PC' IDENTIFIED BY 'root';

CREATE USER IF NOT EXISTS 'club360'@'localhost' IDENTIFIED BY 'club360';
CREATE USER IF NOT EXISTS 'club360'@'127.0.0.1' IDENTIFIED BY 'club360';
CREATE USER IF NOT EXISTS 'club360'@'::1' IDENTIFIED BY 'club360';

GRANT ALL PRIVILEGES ON club360.* TO 'club360'@'localhost';
GRANT ALL PRIVILEGES ON club360.* TO 'club360'@'127.0.0.1';
GRANT ALL PRIVILEGES ON club360.* TO 'club360'@'::1';
GRANT ALL PRIVILEGES ON 360_test.* TO 'club360'@'localhost';
GRANT ALL PRIVILEGES ON 360_test.* TO 'club360'@'127.0.0.1';
GRANT ALL PRIVILEGES ON 360_test.* TO 'club360'@'::1';

FLUSH PRIVILEGES;

-- Tras esto, en el asistente o en backend/.env puedes usar:
--   Host: 127.0.0.1 (recomendado) o localhost
--   Usuario/contraseña: root/root o club360/club360
--   Base: club360 o 360_test

-- --- Oracle MySQL 8.x (no MariaDB): en lugar de los ALTER anteriores, por ejemplo:
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
-- FLUSH PRIVILEGES;

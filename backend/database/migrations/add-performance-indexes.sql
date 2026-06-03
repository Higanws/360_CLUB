-- Índices de rendimiento (idempotente). Error 1061 = ya existe → omitir.
ALTER TABLE `membership_payment` ADD INDEX `idx_membership_payment_end_date` (`end_date`);
ALTER TABLE `club_access_log` ADD INDEX `idx_club_access_log_date_outcome` (`access_date`, `outcome`);

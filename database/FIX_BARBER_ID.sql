-- FIX_BARBER_ID.sql
-- Purpose: Diagnostic checks + safe backup + corrective updates to convert barber_id values
-- from old users.id references to users.auth_user_id so the app shows names instead of UUIDs.
-- IMPORTANT: Review the SELECT results before running the UPDATE section.

-- 1) Inspect rows and see whether join to users by auth_user_id resolves a name
SELECT d.id AS row_id, d.barber_id, u.id AS users_id, u.auth_user_id, u.name
FROM public.daily_cleaning_logs d
LEFT JOIN public.users u ON u.auth_user_id = d.barber_id
ORDER BY d.created_at DESC
LIMIT 50;

-- 2) Count unresolved rows where barber_id does not match users.auth_user_id
SELECT COUNT(*) AS unresolved_by_auth_user_id
FROM public.daily_cleaning_logs d
LEFT JOIN public.users u ON u.auth_user_id = d.barber_id
WHERE u.auth_user_id IS NULL;

-- 3) Confirm how many rows match the OLD users.id column (this shows rows that need conversion)
SELECT COUNT(*) AS using_old_users_id
FROM public.daily_cleaning_logs d
JOIN public.users u_old ON u_old.id = d.barber_id;

-- 4) OPTIONAL: preview which old->new mappings would be applied (preview only)
SELECT d.id AS row_id, d.barber_id AS old_barber_id, u_old.id AS users_id, u_new.auth_user_id AS new_auth_user_id, u_new.name
FROM public.daily_cleaning_logs d
LEFT JOIN public.users u_old ON u_old.id = d.barber_id
LEFT JOIN public.users u_new ON u_new.id = u_old.id
WHERE u_old.id IS NOT NULL
LIMIT 100;

-- 5) BACKUP (recommended) - creates a backup table and copies current rows (only run once)
CREATE TABLE IF NOT EXISTS public.backup_daily_cleaning_logs AS TABLE public.daily_cleaning_logs WITH NO DATA;
INSERT INTO public.backup_daily_cleaning_logs SELECT * FROM public.daily_cleaning_logs;

-- 6) Apply the conversion in a transaction (run only after you reviewed the selects above)
BEGIN;

-- Convert daily_cleaning_logs barber_id from users.id -> users.auth_user_id
UPDATE public.daily_cleaning_logs d
SET barber_id = u.auth_user_id
FROM public.users u
WHERE u.id = d.barber_id
  AND d.barber_id IS NOT NULL;

-- Convert equipment_maintenance barber_id
UPDATE public.equipment_maintenance m
SET barber_id = u.auth_user_id
FROM public.users u
WHERE u.id = m.barber_id
  AND m.barber_id IS NOT NULL;

-- Convert daily_safety_checks barber_id
UPDATE public.daily_safety_checks s
SET barber_id = u.auth_user_id
FROM public.users u
WHERE u.id = s.barber_id
  AND s.barber_id IS NOT NULL;

COMMIT;

-- 7) Verification: ensure joins by auth_user_id now resolve to names
SELECT d.id AS row_id, d.barber_id, u.auth_user_id, u.name
FROM public.daily_cleaning_logs d
LEFT JOIN public.users u ON u.auth_user_id = d.barber_id
ORDER BY d.created_at DESC
LIMIT 50;

-- 8) Cleanup guidance: if you have singular duplicate tables (e.g. daily_cleaning_log) you probably do not need them.
-- Do NOT drop tables until you confirm backups and the plural tables contain the correct data.
-- If you want to remove duplicates after verifying, use: DROP TABLE public.daily_cleaning_log;

-- End of file

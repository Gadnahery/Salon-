-- Staff accounts are keyed by Supabase Auth user ids (auth.users), not Better Auth public."user".
-- Drop the old FK so admin/staff rows can be created from Supabase Auth sign-up.
alter table if exists salon_staff_accounts drop constraint if exists salon_staff_accounts_id_fkey;

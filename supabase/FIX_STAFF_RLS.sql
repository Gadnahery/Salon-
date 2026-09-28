-- Paste this entire file into Supabase → SQL Editor → Run
-- Fixes: new row violates row-level security policy for table "salon_staff_accounts"

alter table if exists salon_staff_accounts drop constraint if exists salon_staff_accounts_id_fkey;

alter table salon_staff_accounts enable row level security;

drop policy if exists salon_staff_accounts_select on salon_staff_accounts;
drop policy if exists salon_staff_accounts_insert on salon_staff_accounts;
drop policy if exists salon_staff_accounts_update on salon_staff_accounts;
drop policy if exists salon_staff_accounts_delete on salon_staff_accounts;

create policy salon_staff_accounts_select on salon_staff_accounts
  for select using (true);

create policy salon_staff_accounts_insert on salon_staff_accounts
  for insert with check (true);

create policy salon_staff_accounts_update on salon_staff_accounts
  for update using (true);

create policy salon_staff_accounts_delete on salon_staff_accounts
  for delete using (true);

alter table if exists "user" enable row level security;
drop policy if exists user_select on "user";
drop policy if exists user_insert on "user";
drop policy if exists user_update on "user";
create policy user_select on "user" for select using (true);
create policy user_insert on "user" for insert with check (true);
create policy user_update on "user" for update using (true);

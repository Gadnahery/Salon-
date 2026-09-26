-- Real staff/admin login accounts, linked 1:1 to a Better Auth user (see
-- migrations/auth/0001_auth.sql) and optionally to a team/stylist profile
-- shown in the booking UI (src/lib/salon/data.ts `team`).
create table if not exists salon_staff_accounts (
  id text primary key references "user" (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'receptionist', 'stylist')),
  team_member_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists salon_staff_accounts_role_idx on salon_staff_accounts (role);

-- Salon — single migration for the Supabase SQL editor
-- Paste this whole file and run it once.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE.

create extension if not exists pgcrypto;

-- ============================================================
-- Auth (Better Auth) — identity + sessions for real staff/admin
-- login. Deliberately NOT covered by the open anon policy below:
-- only the app server (connecting as the table owner via
-- DATABASE_URL) can read/write these. See auth skill notes.
-- ============================================================

create table if not exists "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create table if not exists "session" (
  "id" text not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null
);

create table if not exists "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- Which role a logged-in user has (admin/manager/receptionist/stylist),
-- and which team/stylist profile (salon_staff) they map to, if any.
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

alter table "user" enable row level security;
alter table "session" enable row level security;
alter table "account" enable row level security;
alter table "verification" enable row level security;
alter table salon_staff_accounts enable row level security;
-- No anon/authenticated policies on the five tables above on purpose —
-- default-deny via the Supabase REST API/anon key. The app talks to
-- Postgres directly as the table owner (DATABASE_URL), which is
-- unaffected by RLS.

-- Customers
create table if not exists salon_customers (
  id text primary key,
  name text not null,
  phone text not null,
  since date,
  notes text not null default '',
  preferred_stylist_id text,
  created_at timestamptz not null default now()
);

-- Appointments / bookings
create table if not exists salon_appointments (
  id text primary key,
  service_id text not null,
  stylist_id text not null,
  any_stylist boolean not null default false,
  date date not null,
  time text not null,
  style text not null default '',
  notes text not null default '',
  total integer not null,
  deposit integer not null,
  remaining integer not null,
  payment_method text not null,
  status text not null,
  source text not null default 'appointment',
  customer_id text not null,
  customer_name text not null,
  customer_phone text not null,
  payment_order_id text,
  checked_in_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists salon_appointments_date_idx on salon_appointments (date);
create index if not exists salon_appointments_status_idx on salon_appointments (status);
create index if not exists salon_appointments_order_idx on salon_appointments (payment_order_id);

-- Floor queue
create table if not exists salon_queue (
  id text primary key,
  appointment_id text not null references salon_appointments(id) on delete cascade,
  position integer not null default 0,
  status text not null,
  arrived_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz
);

-- Payments (HarakaPay)
create table if not exists salon_payments (
  id text primary key,
  booking_id text not null,
  customer_id text not null,
  customer_name text not null,
  amount integer not null,
  method text not null,
  status text not null,
  order_id text,
  phone text not null,
  description text not null default '',
  kind text not null default 'deposit',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists salon_payments_order_unique on salon_payments (order_id) where order_id is not null;
create index if not exists salon_payments_booking_idx on salon_payments (booking_id);

-- Notifications
create table if not exists salon_notifications (
  id text primary key,
  title text not null,
  body text not null,
  audience text not null,
  appointment_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Reviews
create table if not exists salon_reviews (
  id text primary key,
  appointment_id text not null,
  customer_name text not null,
  service_id text not null,
  stylist_id text not null,
  rating integer not null,
  quote text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Offers
create table if not exists salon_offers (
  id text primary key,
  title text not null,
  copy text not null,
  service_id text,
  discount_percent integer not null default 0,
  start_date date,
  end_date date,
  active boolean not null default true
);

-- Audit log
create table if not exists salon_audit (
  id text primary key,
  actor text not null,
  action text not null,
  target text not null,
  before_value text,
  after_value text,
  created_at timestamptz not null default now()
);

-- Key/value settings
create table if not exists salon_settings (
  key text primary key,
  value text not null
);

-- Service catalog (admin source of truth)
create table if not exists salon_services (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  price_min integer not null default 500,
  price_max integer,
  duration_min integer not null default 60,
  duration_max integer,
  deposit_percent integer not null default 100,
  image text,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Staff
create table if not exists salon_staff (
  id text primary key,
  name text not null,
  title text not null,
  role text not null,
  phone text,
  email text,
  service_ids text[] not null default '{}',
  active boolean not null default true
);

-- ============================================================
-- RLS — the app uses the anon key, so policies must allow it.
-- Tighten later if you add per-user Supabase Auth.
-- ============================================================

alter table salon_customers enable row level security;
alter table salon_appointments enable row level security;
alter table salon_queue enable row level security;
alter table salon_payments enable row level security;
alter table salon_notifications enable row level security;
alter table salon_reviews enable row level security;
alter table salon_offers enable row level security;
alter table salon_audit enable row level security;
alter table salon_settings enable row level security;
alter table salon_services enable row level security;
alter table salon_staff enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'salon_customers','salon_appointments','salon_queue','salon_payments',
    'salon_notifications','salon_reviews','salon_offers','salon_audit',
    'salon_settings','salon_services','salon_staff'
  ]
  loop
    execute format('drop policy if exists salon_anon_all on %I', t);
    execute format(
      'create policy salon_anon_all on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

insert into salon_settings (key, value)
values
  ('salon_name', 'Salon'),
  ('test_price_tsh', '500'),
  ('payment_provider', 'harakapay')
on conflict (key) do update set value = excluded.value;

-- ============================================================
-- Media (service images, gallery, staff photos)
-- ============================================================

create table if not exists salon_media (
  id text primary key,
  kind text not null check (kind in ('service', 'gallery', 'staff', 'customer_ref', 'promo')),
  owner_id text,
  url text not null,
  alt text default '',
  sort_order int default 0,
  visible boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists salon_media_kind_idx on salon_media (kind);
create index if not exists salon_media_owner_idx on salon_media (owner_id);

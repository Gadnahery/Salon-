-- Additive only: messaging outbox, consent, templates, waitlist, feature flags storage
-- Safe to run on existing DBs; does not alter existing columns.

create table if not exists salon_message_outbox (
  id text primary key,
  channel text not null check (channel in ('whatsapp','sms','push','in_app')),
  event_type text not null,
  recipient_phone text,
  recipient_user_id text,
  template_id text,
  body text not null,
  locale text not null default 'en',
  status text not null default 'pending'
    check (status in ('pending','queued','sent','delivered','failed','skipped_disabled','skipped_consent')),
  provider text,
  provider_message_id text,
  error text,
  appointment_id text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  meta jsonb default '{}'::jsonb
);

create index if not exists salon_message_outbox_status_idx on salon_message_outbox (status, scheduled_for);
create index if not exists salon_message_outbox_appt_idx on salon_message_outbox (appointment_id);

create table if not exists salon_message_consent (
  id text primary key default gen_random_uuid()::text,
  customer_id text,
  phone text not null,
  channel text not null check (channel in ('whatsapp','sms','push','marketing')),
  opted_in boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (phone, channel)
);

create table if not exists salon_message_templates (
  id text primary key,
  event_type text not null,
  channel text not null,
  locale text not null default 'en',
  body text not null,
  approval_status text not null default 'draft'
    check (approval_status in ('draft','pending_submission','submitted','approved','rejected')),
  needs_native_review boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists salon_waitlist (
  id text primary key,
  customer_id text,
  phone text not null,
  customer_name text,
  service_id text not null,
  staff_id text,
  date_from text not null,
  date_to text not null,
  time_from text,
  time_to text,
  status text not null default 'waiting'
    check (status in ('waiting','offered','accepted','declined','expired','cancelled','booked')),
  offered_slot_start text,
  offered_slot_date text,
  offered_slot_time text,
  offer_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists salon_waitlist_status_idx on salon_waitlist (status, created_at);

create table if not exists salon_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into salon_feature_flags (key, enabled) values
  ('whatsapp_messaging', false),
  ('sms_messaging', false),
  ('otp_login', false),
  ('waitlist_backfill', true),
  ('i18n_swahili', true)
on conflict (key) do nothing;

-- RLS: service role / anon read for flags; writes via service later
alter table salon_feature_flags enable row level security;
drop policy if exists salon_feature_flags_read on salon_feature_flags;
create policy salon_feature_flags_read on salon_feature_flags for select using (true);

alter table salon_message_templates enable row level security;
drop policy if exists salon_templates_read on salon_message_templates;
create policy salon_templates_read on salon_message_templates for select using (true);

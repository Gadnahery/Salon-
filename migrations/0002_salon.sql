create table if not exists salon_customers (
  id text primary key,
  name text not null,
  phone text not null,
  since date,
  notes text not null default '',
  preferred_stylist_id text,
  created_at timestamptz not null default now()
);

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

create table if not exists salon_queue (
  id text primary key,
  appointment_id text not null references salon_appointments(id) on delete cascade,
  position integer not null default 0,
  status text not null,
  arrived_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz
);

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
create index if not exists salon_payments_order_idx on salon_payments (order_id);

create table if not exists salon_notifications (
  id text primary key,
  title text not null,
  body text not null,
  audience text not null,
  appointment_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

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

create table if not exists salon_audit (
  id text primary key,
  actor text not null,
  action text not null,
  target text not null,
  before_value text,
  after_value text,
  created_at timestamptz not null default now()
);

create table if not exists salon_settings (
  key text primary key,
  value text not null
);

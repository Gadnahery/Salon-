create index if not exists salon_appointments_order_idx on salon_appointments (payment_order_id);

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

create table if not exists salon_staff (
  id text primary key,
  name text not null,
  title text not null,
  role text not null,
  phone text,
  email text,
  active boolean not null default true
);

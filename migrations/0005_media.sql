-- Media assets for services, gallery, staff photos, and customer references.
-- Safe to re-run.

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

-- Optional: store service cover overrides separately from seed data
alter table if exists salon_services
  add column if not exists image_url text,
  add column if not exists gallery_urls text[];

-- Web Push subscriptions for staff/admin/customer devices
create table if not exists public.salon_push_subscriptions (
  endpoint text primary key,
  keys_p256dh text not null,
  keys_auth text not null,
  portal text not null check (portal in ('staff', 'admin', 'customer')),
  actor_id text,
  updated_at timestamptz default now()
);

alter table public.salon_push_subscriptions enable row level security;

drop policy if exists "push_sub_all" on public.salon_push_subscriptions;
create policy "push_sub_all" on public.salon_push_subscriptions
  for all using (true) with check (true);

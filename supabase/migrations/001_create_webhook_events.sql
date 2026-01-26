-- Migration: create webhook_events and add unique constraint on user_roles
create table if not exists webhook_events (
  id text primary key,
  topic text,
  received_at timestamptz default now()
);

-- Ensure user_roles has a unique constraint on (user_id, role)
alter table if exists user_roles
  add constraint if not exists user_roles_unique unique (user_id, role);

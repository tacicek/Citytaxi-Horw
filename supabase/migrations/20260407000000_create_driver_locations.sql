-- ─────────────────────────────────────────────────────────────────────────────
-- Driver live-location tracking table
-- Run this in Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists driver_locations (
  id          uuid            primary key default gen_random_uuid(),
  driver_id   text            not null unique,   -- e.g. 'citytaxi-horw-1'
  lat         double precision not null,
  lng         double precision not null,
  is_active   boolean         not null default false,
  heading     double precision,                  -- degrees 0-360 (nullable)
  speed       double precision,                  -- m/s (nullable)
  updated_at  timestamptz     not null default now()
);

-- Row Level Security
alter table driver_locations enable row level security;

-- Anyone (customer) can read driver location
create policy "Public read driver_locations"
  on driver_locations for select
  using (true);

-- Only service_role (our API route with SUPABASE_SERVICE_KEY) can insert/update
-- Client-side updates are blocked — location goes through /api/driver/location
create policy "Service role write driver_locations"
  on driver_locations for all
  using (auth.role() = 'service_role');

-- Enable Realtime on this table so customers get live updates
alter publication supabase_realtime add table driver_locations;

-- Seed the single driver row (update driver_id if needed)
insert into driver_locations (driver_id, lat, lng, is_active)
values ('citytaxi-horw-1', 47.0136, 8.3083, false)
on conflict (driver_id) do nothing;

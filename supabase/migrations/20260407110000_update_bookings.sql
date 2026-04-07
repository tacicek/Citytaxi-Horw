-- Add picked_up_at timestamp and extend status check constraint.
-- Also allow authenticated Supabase users (the driver) to read bookings.

-- 1. Drop old status check constraint, add new one including 'picked_up'
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'accepted', 'rejected', 'picked_up'));

-- 2. Add picked_up_at column
alter table bookings add column if not exists picked_up_at timestamptz;

-- 3. RLS: allow any authenticated Supabase user (the driver account) to SELECT and UPDATE
create policy "Authenticated users can read bookings"
  on bookings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can update bookings"
  on bookings for update
  using (auth.role() = 'authenticated');

-- Booking requests: stored when customer submits form.
-- Driver reviews, accepts → tracking email is sent to customer.

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text not null,
  pickup      text not null,
  destination text not null,
  date        text not null,
  time        text not null,
  passengers  text not null default '1',
  service     text not null default 'Stadtfahrt',
  return_trip boolean not null default false,
  flight_number text,
  luggage     text,
  notes       text,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'rejected')),
  received_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table bookings enable row level security;

-- Anyone can insert (customer form submission)
create policy "Public insert bookings"
  on bookings for insert
  with check (true);

-- Only service_role can read/update (driver accept endpoint uses service key)
create policy "Service role manage bookings"
  on bookings for all
  using (auth.role() = 'service_role');

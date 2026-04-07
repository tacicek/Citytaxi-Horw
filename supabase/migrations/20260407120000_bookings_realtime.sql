-- Enable Realtime for bookings table so the driver dashboard
-- receives live INSERT/UPDATE events without page refresh.
alter publication supabase_realtime add table bookings;

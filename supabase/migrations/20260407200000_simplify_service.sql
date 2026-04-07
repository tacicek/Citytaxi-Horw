-- Simplify service column: only two values are now used (Stadtfahrt | Flughafentransfer).
-- Old values from before are preserved; new bookings will only have these two values.
alter table bookings drop constraint if exists bookings_service_check;
alter table bookings add constraint bookings_service_check
  check (service in ('Stadtfahrt', 'Flughafentransfer'));

-- Update any legacy rows that have other service values to 'Stadtfahrt'
update bookings
set service = 'Stadtfahrt'
where service not in ('Stadtfahrt', 'Flughafentransfer');

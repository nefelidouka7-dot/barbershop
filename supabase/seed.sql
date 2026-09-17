-- Seed sample data for local testing
-- Run after 001_schema.sql

insert into public.barbers (id, name, photo_url, bio, active) values
  (
    '11111111-1111-1111-1111-111111111111',
    'Alex',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
    'Cuts, fades, and clean finishes.',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Chris',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    'Beards, trims, and classic shaves.',
    true
  )
on conflict (id) do nothing;

insert into public.services (id, name, duration_minutes, price, active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Haircut', 30, 20.00, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Haircut + Beard', 45, 30.00, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Beard Trim', 20, 12.00, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Hot Towel Shave', 40, 25.00, true)
on conflict (id) do nothing;

insert into public.barber_services (barber_id, service_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
on conflict do nothing;

-- Mon–Sat 09:00–17:00 for both barbers (day_of_week: 0=Sun … 6=Sat)
insert into public.working_hours (barber_id, day_of_week, start_time, end_time)
select b.id, d.dow, '09:00'::time, '17:00'::time
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) as b(id)
cross join (values (1),(2),(3),(4),(5),(6)) as d(dow)
on conflict do nothing;

-- Sample lunch break tomorrow for Alex (adjusts relative to now)
insert into public.time_off (barber_id, start_datetime, end_datetime, reason)
values (
  '11111111-1111-1111-1111-111111111111',
  date_trunc('day', now() + interval '1 day') + interval '13 hours',
  date_trunc('day', now() + interval '1 day') + interval '14 hours',
  'Lunch break'
);

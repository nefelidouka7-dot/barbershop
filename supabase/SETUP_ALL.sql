-- Barber shop booking schema + RLS
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- Roles enum via text + check (shop_owner | barber | customer)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('shop_owner', 'barber', 'customer')),
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  photo_url text,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.barber_services (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (barber_id, service_id)
);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  unique (barber_id, day_of_week, start_time, end_time)
);

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  reason text,
  check (end_datetime > start_datetime)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create type public.appointment_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed'
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_datetime > start_datetime)
);

create index if not exists appointments_barber_start_idx
  on public.appointments (barber_id, start_datetime);

create index if not exists appointments_status_idx
  on public.appointments (status);

-- Prevent overlapping active appointments for the same barber
create or replace function public.appointments_no_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('cancelled') then
    return new;
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.barber_id = new.barber_id
      and a.id is distinct from new.id
      and a.status in ('pending', 'confirmed')
      and tstzrange(a.start_datetime, a.end_datetime, '[)') &&
          tstzrange(new.start_datetime, new.end_datetime, '[)')
  ) then
    raise exception 'Time slot is already booked for this barber';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_appointments_no_overlap on public.appointments;
create trigger trg_appointments_no_overlap
  before insert or update on public.appointments
  for each row execute function public.appointments_no_overlap();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_shop_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'shop_owner'
  );
$$;

create or replace function public.is_barber_user(p_barber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbers b
    where b.id = p_barber_id and b.user_id = auth.uid()
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.barber_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;

-- Profiles
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_shop_owner());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Barbers: public read active; staff manage
create policy "Public read active barbers"
  on public.barbers for select
  using (active = true or public.is_shop_owner() or user_id = auth.uid());

create policy "Owners manage barbers"
  on public.barbers for all
  using (public.is_shop_owner())
  with check (public.is_shop_owner());

create policy "Barbers update self"
  on public.barbers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Services
create policy "Public read active services"
  on public.services for select
  using (active = true or public.is_shop_owner() or public.current_role() = 'barber');

create policy "Owners manage services"
  on public.services for all
  using (public.is_shop_owner())
  with check (public.is_shop_owner());

-- Barber services
create policy "Public read barber_services"
  on public.barber_services for select
  using (true);

create policy "Staff manage barber_services"
  on public.barber_services for all
  using (public.is_shop_owner() or public.is_barber_user(barber_id))
  with check (public.is_shop_owner() or public.is_barber_user(barber_id));

-- Working hours
create policy "Public read working_hours"
  on public.working_hours for select
  using (true);

create policy "Staff manage working_hours"
  on public.working_hours for all
  using (public.is_shop_owner() or public.is_barber_user(barber_id))
  with check (public.is_shop_owner() or public.is_barber_user(barber_id));

-- Time off
create policy "Public read time_off"
  on public.time_off for select
  using (true);

create policy "Staff manage time_off"
  on public.time_off for all
  using (public.is_shop_owner() or public.is_barber_user(barber_id))
  with check (public.is_shop_owner() or public.is_barber_user(barber_id));

-- Customers
create policy "Customers read own"
  on public.customers for select
  using (
    user_id = auth.uid()
    or public.is_shop_owner()
    or public.current_role() = 'barber'
  );

create policy "Customers insert own"
  on public.customers for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Customers update own"
  on public.customers for update
  using (user_id = auth.uid() or public.is_shop_owner());

-- Appointments
create policy "Public insert appointments"
  on public.appointments for insert
  with check (true);

create policy "Staff read appointments"
  on public.appointments for select
  using (
    public.is_shop_owner()
    or public.is_barber_user(barber_id)
    or (customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    ))
    or (
      auth.uid() is not null
      and lower(customer_email) = lower((select email from public.profiles where id = auth.uid()))
    )
  );

create policy "Staff update appointments"
  on public.appointments for update
  using (
    public.is_shop_owner()
    or public.is_barber_user(barber_id)
    or (customer_id is not null and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    ))
  );

-- Realtime
alter publication supabase_realtime add table public.appointments;
-- Availability RPCs + booking lock (without exposing customer PII)

-- Busy windows only (no customer fields)
create or replace view public.appointment_busy
with (security_invoker = false)
as
select
  id,
  barber_id,
  start_datetime,
  end_datetime,
  status
from public.appointments
where status in ('pending', 'confirmed');

grant select on public.appointment_busy to anon, authenticated;

-- Restore proper appointment SELECT (not public *)
drop policy if exists "Public read appointment schedule fields" on public.appointments;
drop policy if exists "Staff read appointments" on public.appointments;

create policy "Staff and owners read appointments"
  on public.appointments for select
  using (
    public.is_shop_owner()
    or public.is_barber_user(barber_id)
  );

create policy "Customers read own appointments"
  on public.appointments for select
  using (
    (
      customer_id is not null and exists (
        select 1 from public.customers c
        where c.id = customer_id and c.user_id = auth.uid()
      )
    )
    or (
      auth.uid() is not null
      and customer_email is not null
      and lower(customer_email) = lower((select email from public.profiles where id = auth.uid()))
    )
  );

drop policy if exists "Staff update appointments" on public.appointments;
drop policy if exists "Customers cancel or reschedule own" on public.appointments;

create policy "Staff update appointments"
  on public.appointments for update
  using (
    public.is_shop_owner()
    or public.is_barber_user(barber_id)
  );

create policy "Customers cancel or reschedule own"
  on public.appointments for update
  using (
    (
      customer_id is not null and exists (
        select 1 from public.customers c
        where c.id = customer_id and c.user_id = auth.uid()
      )
    )
    or (
      auth.uid() is not null
      and customer_email is not null
      and lower(customer_email) = lower((select email from public.profiles where id = auth.uid()))
    )
  )
  with check (
    status in ('pending', 'confirmed', 'cancelled')
  );

create or replace function public.get_barber_day_busy(
  p_barber_id uuid,
  p_day date
)
returns table (
  start_datetime timestamptz,
  end_datetime timestamptz,
  kind text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.start_datetime, a.end_datetime, 'appointment'::text
  from public.appointments a
  where a.barber_id = p_barber_id
    and a.status in ('pending', 'confirmed')
    and a.start_datetime::date = p_day

  union all

  select t.start_datetime, t.end_datetime, 'time_off'::text
  from public.time_off t
  where t.barber_id = p_barber_id
    and t.start_datetime < (p_day + 1)
    and t.end_datetime > p_day;
$$;

grant execute on function public.get_barber_day_busy(uuid, date) to anon, authenticated;

create or replace function public.try_book_appointment(
  p_barber_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_start timestamptz,
  p_end timestamptz,
  p_customer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_dur int;
  v_end timestamptz;
begin
  select duration_minutes into v_dur
  from public.services
  where id = p_service_id and active = true;

  if v_dur is null then
    raise exception 'Service not found';
  end if;

  v_end := p_start + make_interval(mins => v_dur);

  perform pg_advisory_xact_lock(hashtext(p_barber_id::text));

  if exists (
    select 1 from public.appointments a
    where a.barber_id = p_barber_id
      and a.status in ('pending', 'confirmed')
      and tstzrange(a.start_datetime, a.end_datetime, '[)') &&
          tstzrange(p_start, v_end, '[)')
  ) then
    raise exception 'Time slot is already booked for this barber';
  end if;

  if exists (
    select 1 from public.time_off t
    where t.barber_id = p_barber_id
      and tstzrange(t.start_datetime, t.end_datetime, '[)') &&
          tstzrange(p_start, v_end, '[)')
  ) then
    raise exception 'Barber is unavailable during this time';
  end if;

  insert into public.appointments (
    barber_id, service_id, customer_id,
    customer_name, customer_phone, customer_email,
    start_datetime, end_datetime, status
  ) values (
    p_barber_id, p_service_id, p_customer_id,
    p_customer_name, p_customer_phone, nullif(p_customer_email, ''),
    p_start, v_end, 'confirmed'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.try_book_appointment(
  uuid, uuid, text, text, text, timestamptz, timestamptz, uuid
) to anon, authenticated, service_role;
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

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

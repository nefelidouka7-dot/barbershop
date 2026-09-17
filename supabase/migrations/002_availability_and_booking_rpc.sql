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

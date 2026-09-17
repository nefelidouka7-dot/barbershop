-- Make staff names/bios generic.
-- Run in Supabase → SQL Editor (optional — the app already shows generic names publicly).

with ranked as (
  select
    id,
    row_number() over (order by created_at, name) as rn
  from public.barbers
  where active = true
)
update public.barbers b
set
  name = case r.rn
    when 1 then 'Alex'
    when 2 then 'Chris'
    when 3 then 'Sam'
    else 'Jordan'
  end,
  bio = case r.rn
    when 1 then 'Cuts, fades, and clean finishes.'
    when 2 then 'Beards, trims, and classic shaves.'
    when 3 then 'Classic and modern cuts.'
    else 'Fades, styling, and clean lines.'
  end
from ranked r
where b.id = r.id;

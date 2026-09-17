# Atelier Barber — Booking App

Full-stack barber shop booking with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind**, **shadcn-style UI**, and **Supabase** (Postgres + Auth + Realtime).

## Features

- Public landing + multi-step booking (barber → service → date/slot → details)
- Guest booking (name + phone/email, no account required)
- Optional customer magic-link login (`/account`) to view / cancel / **reschedule**
- Availability API (`/api/availability`) + atomic `try_book_appointment` RPC
- Slot engine: working hours − appointments − time off
- DB trigger + advisory lock prevent double-booking
- Admin: week calendar agenda, barbers, hours/time-off, services, customers, stats
- Staff-only middleware (shop_owner / barber roles)
- Realtime toast on new appointments
- Confirmation email (Resend) + hourly reminder cron

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run **in order**:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_availability_and_booking_rpc.sql`
   - `supabase/seed.sql`
3. Copy Project URL + anon key + service role key into `.env.local`
4. Auth → Email provider enabled
5. Auth → URL config → add redirect:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_DOMAIN/auth/callback`
6. Create a staff user in Authentication, then:

```sql
update public.profiles set role = 'shop_owner' where email = 'you@example.com';
-- optional: link barber row to that user
update public.barbers set user_id = '<auth-user-uuid>' where name = 'Alex';
```

### 3. Email (optional)

Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`.

### 4. Run

```bash
npm run dev
```

- Public: `/`, `/book`, `/account`
- Admin: `/admin/login` → `/admin`
- Auth callback: `/auth/callback`

### 5. Reminders cron (optional)

`vercel.json` hits `/api/cron/reminders` hourly. Set `CRON_SECRET`.

## Env vars

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser + SSR client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (prod) | Bookings, availability, cron |
| `RESEND_API_KEY` | no | Confirmation / reminder emails |
| `EMAIL_FROM` | no | From address |
| `CRON_SECRET` | no | Protect reminder endpoint |
| `NEXT_PUBLIC_SHOP_NAME` | no | Brand name |
| `NEXT_PUBLIC_APP_URL` | no | Canonical URL |

## Deploy (Vercel)

1. Push repo → Import on Vercel  
2. Add env vars  
3. Deploy  

## Project structure

```
app/
  (public)/book|account
  (admin)/admin/...
  api/availability|bookings|cron
  auth/callback
components/   ui, layout, admin
lib/          supabase, booking slots, email, validators
supabase/     migrations + seed
types/        database.ts
```

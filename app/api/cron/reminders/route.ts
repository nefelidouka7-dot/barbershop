import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendBookingReminder } from "@/lib/email";

/** Call via cron (Vercel Cron / Supabase scheduled function) every hour */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ skipped: true, reason: "no service role" });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  const { data: appts, error } = await supabase
    .from("appointments")
    .select("*, barber:barbers(name), service:services(name)")
    .eq("reminder_sent", false)
    .in("status", ["pending", "confirmed"])
    .gte("start_datetime", windowStart.toISOString())
    .lte("start_datetime", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const a of appts || []) {
    if (!a.customer_email) continue;
    try {
      await sendBookingReminder({
        to: a.customer_email,
        customerName: a.customer_name,
        barberName: (a as { barber?: { name: string } }).barber?.name || "your barber",
        serviceName:
          (a as { service?: { name: string } }).service?.name || "appointment",
        start: new Date(a.start_datetime),
      });
      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", a.id);
      sent += 1;
    } catch {
      /* continue */
    }
  }

  return NextResponse.json({ sent, checked: appts?.length || 0 });
}

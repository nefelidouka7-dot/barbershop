import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getAvailableSlots, parseLocalDate } from "@/lib/booking/slots";
import { format } from "date-fns";
import type { Appointment, TimeOff, WorkingHours } from "@/types/database";

const schema = z.object({
  appointment_id: z.string().uuid(),
  start_datetime: z.string().datetime(),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceClient()
      : userClient;

    const { data: appt, error } = await supabase
      .from("appointments")
      .select("*, service:services(*)")
      .eq("id", parsed.data.appointment_id)
      .single();

    if (error || !appt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      !appt.customer_email ||
      appt.customer_email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["pending", "confirmed"].includes(appt.status)) {
      return NextResponse.json(
        { error: "Only upcoming bookings can be rescheduled" },
        { status: 400 }
      );
    }

    const duration =
      appt.service?.duration_minutes ||
      Math.round(
        (new Date(appt.end_datetime).getTime() -
          new Date(appt.start_datetime).getTime()) /
          60000
      );

    const start = new Date(parsed.data.start_datetime);
    const end = addMinutes(start, duration);

    if (start.getTime() < Date.now()) {
      return NextResponse.json({ error: "Pick a future time" }, { status: 400 });
    }

    // Check availability excluding this appointment
    const dayKey = format(start, "yyyy-MM-dd");
    const dayStart = parseLocalDate(dayKey);
    const dayEnd = addMinutes(dayStart, 24 * 60);

    const [{ data: hours }, { data: appts }, { data: offs }] = await Promise.all([
      supabase.from("working_hours").select("*").eq("barber_id", appt.barber_id),
      supabase
        .from("appointments")
        .select("id,start_datetime,end_datetime,status")
        .eq("barber_id", appt.barber_id)
        .gte("start_datetime", dayStart.toISOString())
        .lt("start_datetime", dayEnd.toISOString()),
      supabase
        .from("time_off")
        .select("start_datetime,end_datetime")
        .eq("barber_id", appt.barber_id)
        .lt("start_datetime", dayEnd.toISOString())
        .gt("end_datetime", dayStart.toISOString()),
    ]);

    const others = ((appts as Appointment[]) || []).filter(
      (a) => a.id !== appt.id
    );

    const slots = getAvailableSlots({
      date: dayStart,
      durationMinutes: duration,
      workingHours: ((hours as WorkingHours[])?.length
        ? hours
        : [1, 2, 3, 4, 5, 6].map((d) => ({
            id: String(d),
            barber_id: appt.barber_id,
            day_of_week: d,
            start_time: "09:00",
            end_time: "17:00",
          }))) as WorkingHours[],
      appointments: others,
      timeOff: (offs as TimeOff[]) || [],
    });

    const ok = slots.some((s) => Math.abs(s.getTime() - start.getTime()) < 1000);
    if (!ok) {
      return NextResponse.json(
        { error: "That slot is not available" },
        { status: 409 }
      );
    }

    const { error: updErr } = await supabase
      .from("appointments")
      .update({
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        status: "confirmed",
        reminder_sent: false,
      })
      .eq("id", appt.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 409 });
    }

    return NextResponse.json({ ok: true, start: start.toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

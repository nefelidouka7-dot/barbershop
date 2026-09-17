import { NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_SERVICES, demoWorkingHours } from "@/lib/demo-data";
import { getAvailableSlots, parseLocalDate } from "@/lib/booking/slots";
import type { Appointment, TimeOff, WorkingHours } from "@/types/database";

const querySchema = z.object({
  barber_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  admin: z
    .enum(["1", "true", "0", "false"])
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

function demoResponse(
  barberId: string,
  serviceId: string,
  date: string,
  admin = false
) {
  const dayStart = parseLocalDate(date);
  const service =
    DEMO_SERVICES.find((s) => s.id === serviceId) || DEMO_SERVICES[0];
  const slots = getAvailableSlots({
    date: dayStart,
    durationMinutes: service.duration_minutes,
    workingHours: demoWorkingHours(barberId),
    appointments: [],
    timeOff: [],
    admin,
  });
  return NextResponse.json({
    date,
    demo: true,
    closed: false,
    slots: slots.map((s) => ({
      start: s.toISOString(),
      label: format(s, "HH:mm"),
    })),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    barber_id: searchParams.get("barber_id"),
    service_id: searchParams.get("service_id"),
    date: searchParams.get("date"),
    admin: searchParams.get("admin") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { barber_id, service_id, date, admin } = parsed.data;

  if (!isSupabaseConfigured()) {
    return demoResponse(barber_id, service_id, date, admin);
  }

  const dayStart = parseLocalDate(date);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const hasServiceRole = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key"
  );

  try {
    const supabase = hasServiceRole
      ? createServiceClient()
      : await createClient();

    const [{ data: service }, { data: hours }, { data: appts }, { data: offs }] =
      await Promise.all([
        supabase.from("services").select("*").eq("id", service_id).single(),
        supabase.from("working_hours").select("*").eq("barber_id", barber_id),
        hasServiceRole
          ? supabase
              .from("appointments")
              .select("start_datetime,end_datetime,status")
              .eq("barber_id", barber_id)
              .gte("start_datetime", dayStart.toISOString())
              .lt("start_datetime", dayEnd.toISOString())
          : supabase
              .from("appointment_busy")
              .select("start_datetime,end_datetime,status")
              .eq("barber_id", barber_id)
              .gte("start_datetime", dayStart.toISOString())
              .lt("start_datetime", dayEnd.toISOString()),
        supabase
          .from("time_off")
          .select("start_datetime,end_datetime")
          .eq("barber_id", barber_id)
          .lt("start_datetime", dayEnd.toISOString())
          .gt("end_datetime", dayStart.toISOString()),
      ]);

    const duration =
      service?.duration_minutes ||
      DEMO_SERVICES.find((s) => s.id === service_id)?.duration_minutes ||
      30;

    const workingHours = (hours as WorkingHours[])?.length
      ? (hours as WorkingHours[])
      : demoWorkingHours(barber_id);

    const dayHours = workingHours.filter(
      (w) => w.day_of_week === dayStart.getDay()
    );

    const slots = getAvailableSlots({
      date: dayStart,
      durationMinutes: duration,
      workingHours,
      appointments: (appts as Appointment[]) || [],
      timeOff: (offs as TimeOff[]) || [],
      admin,
    });

    return NextResponse.json({
      date,
      closed: dayHours.length === 0,
      slots: slots.map((s) => ({
        start: s.toISOString(),
        label: format(s, "HH:mm"),
      })),
    });
  } catch {
    return demoResponse(barber_id, service_id, date, admin);
  }
}

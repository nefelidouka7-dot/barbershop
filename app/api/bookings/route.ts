import { NextResponse } from "next/server";
import { addMinutes, format, isBefore, startOfDay } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_BARBERS, DEMO_SERVICES } from "@/lib/demo-data";
import { sendBookingConfirmation } from "@/lib/email";
import { bookingDetailsSchema, adminBookingDetailsSchema } from "@/lib/validators";
import { getAvailableSlots, parseLocalDate } from "@/lib/booking/slots";
import type { WorkingHours, Appointment, TimeOff } from "@/types/database";

const bookingMetaSchema = z.object({
  barber_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_datetime: z.string().datetime(),
  admin: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const meta = bookingMetaSchema.safeParse(json);
    if (!meta.success) {
      return NextResponse.json(
        { error: "Invalid booking details", details: meta.error.flatten() },
        { status: 400 }
      );
    }

    const isAdmin = Boolean(meta.data.admin);
    const detailsSchema = isAdmin
      ? adminBookingDetailsSchema
      : bookingDetailsSchema;
    const details = detailsSchema.safeParse(json);
    if (!details.success) {
      return NextResponse.json(
        { error: "Invalid booking details", details: details.error.flatten() },
        { status: 400 }
      );
    }

    const data = { ...meta.data, ...details.data };
    const start = new Date(data.start_datetime);
    const dayStart = startOfDay(start);
    const today = startOfDay(new Date());

    if (isBefore(dayStart, today)) {
      return NextResponse.json(
        { error: "Cannot add appointments on past dates" },
        { status: 400 }
      );
    }

    if (!isAdmin && start.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "Cannot book a time in the past" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      const service =
        DEMO_SERVICES.find((s) => s.id === data.service_id) || DEMO_SERVICES[0];
      const barber =
        DEMO_BARBERS.find((b) => b.id === data.barber_id) || DEMO_BARBERS[0];
      return NextResponse.json({
        id: crypto.randomUUID(),
        demo: true,
        summary: {
          barber: barber.name,
          service: service.name,
          start: start.toISOString(),
        },
      });
    }

    const hasServiceKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key"
    );
    const supabase = hasServiceKey
      ? createServiceClient()
      : await createClient();

    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("*")
      .eq("id", data.service_id)
      .eq("active", true)
      .single();

    if (svcErr || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const { data: barber } = await supabase
      .from("barbers")
      .select("*")
      .eq("id", data.barber_id)
      .eq("active", true)
      .single();

    if (!barber) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    const end = addMinutes(start, service.duration_minutes);

    const { data: rpcId, error: rpcError } = await supabase.rpc(
      "try_book_appointment",
      {
        p_barber_id: data.barber_id,
        p_service_id: data.service_id,
        p_customer_name: data.customer_name || "",
        p_customer_phone: data.customer_phone || "",
        p_customer_email: data.customer_email || "",
        p_start: start.toISOString(),
        p_end: end.toISOString(),
        p_customer_id: null,
      }
    );

    let appointmentId: string | null = rpcId as string | null;

    if (rpcError) {
      if (
        rpcError.message.includes("Could not find the function") ||
        rpcError.code === "PGRST202"
      ) {
        const dayKey = format(start, "yyyy-MM-dd");
        const dayStart = parseLocalDate(dayKey);
        const dayEnd = addMinutes(dayStart, 24 * 60);

        const [{ data: hours }, { data: appts }, { data: offs }] =
          await Promise.all([
            supabase
              .from("working_hours")
              .select("*")
              .eq("barber_id", data.barber_id),
            supabase
              .from("appointments")
              .select("start_datetime,end_datetime,status")
              .eq("barber_id", data.barber_id)
              .gte("start_datetime", dayStart.toISOString())
              .lt("start_datetime", dayEnd.toISOString()),
            supabase
              .from("time_off")
              .select("start_datetime,end_datetime")
              .eq("barber_id", data.barber_id)
              .lt("start_datetime", dayEnd.toISOString())
              .gt("end_datetime", dayStart.toISOString()),
          ]);

        const slots = getAvailableSlots({
          date: dayStart,
          durationMinutes: service.duration_minutes,
          workingHours: ((hours as WorkingHours[])?.length
            ? hours
            : [1, 2, 3, 4, 5, 6].map((d) => ({
                id: String(d),
                barber_id: data.barber_id,
                day_of_week: d,
                start_time: "09:00",
                end_time: "17:00",
              }))) as WorkingHours[],
          appointments: (appts as Appointment[]) || [],
          timeOff: (offs as TimeOff[]) || [],
          admin: isAdmin,
        });

        const ok = slots.some(
          (s) => Math.abs(s.getTime() - start.getTime()) < 1000
        );
        if (!ok && !isAdmin) {
          return NextResponse.json(
            { error: "That time slot is no longer available" },
            { status: 409 }
          );
        }

        const { data: appointment, error } = await supabase
          .from("appointments")
          .insert({
            barber_id: data.barber_id,
            service_id: data.service_id,
            customer_name: data.customer_name || "",
            customer_phone: data.customer_phone || "",
            customer_email: data.customer_email || null,
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            status: "confirmed",
          })
          .select("id")
          .single();

        if (error) {
          const msg = error.message.includes("already booked")
            ? "That time slot was just taken. Pick another."
            : error.message;
          return NextResponse.json({ error: msg }, { status: 409 });
        }
        appointmentId = appointment.id;
      } else {
        const msg = rpcError.message.includes("already booked")
          ? "That time slot was just taken. Pick another."
          : rpcError.message.includes("unavailable")
            ? "Barber is unavailable during this time."
            : rpcError.message;
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }

    if (data.customer_email) {
      try {
        await sendBookingConfirmation({
          to: data.customer_email,
          customerName: data.customer_name,
          barberName: barber.name,
          serviceName: service.name,
          start,
          end,
        });
      } catch {
        /* optional */
      }
    }

    return NextResponse.json({ id: appointmentId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

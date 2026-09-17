import {
  addDays,
  addMinutes,
  format,
  isBefore,
  parse,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import type { Appointment, TimeOff, WorkingHours } from "@/types/database";

function parseTimeOnDate(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(startOfDay(date), h), m);
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function getAvailableSlots(params: {
  date: Date;
  durationMinutes: number;
  workingHours: WorkingHours[];
  appointments: Pick<Appointment, "start_datetime" | "end_datetime" | "status">[];
  timeOff: Pick<TimeOff, "start_datetime" | "end_datetime">[];
  slotIntervalMinutes?: number;
  now?: Date;
  /** Admin: include past times and fall back to default day window if closed */
  admin?: boolean;
}): Date[] {
  const {
    date,
    durationMinutes,
    workingHours,
    appointments,
    timeOff,
    slotIntervalMinutes = 15,
    now = new Date(),
    admin = false,
  } = params;

  const day = date.getDay();
  let windows = workingHours.filter((w) => w.day_of_week === day);

  // Staff may book even when the public schedule is empty for that day
  if (!windows.length && admin) {
    windows = [
      {
        id: "admin-fallback",
        barber_id: "",
        day_of_week: day,
        start_time: "09:00",
        end_time: "20:00",
      },
    ];
  }

  if (!windows.length) return [];

  const activeAppts = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );

  const slots: Date[] = [];

  for (const window of windows) {
    let cursor = parseTimeOnDate(date, window.start_time.slice(0, 5));
    const windowEnd = parseTimeOnDate(date, window.end_time.slice(0, 5));

    while (addMinutes(cursor, durationMinutes) <= windowEnd) {
      const slotEnd = addMinutes(cursor, durationMinutes);
      const inPast = isBefore(cursor, now);

      if (admin || !inPast) {
        const blockedByAppt = activeAppts.some((a) =>
          overlaps(
            cursor,
            slotEnd,
            new Date(a.start_datetime),
            new Date(a.end_datetime)
          )
        );
        const blockedByOff =
          !admin &&
          timeOff.some((t) =>
            overlaps(
              cursor,
              slotEnd,
              new Date(t.start_datetime),
              new Date(t.end_datetime)
            )
          );

        if (!blockedByAppt && !blockedByOff) {
          slots.push(new Date(cursor));
        }
      }

      cursor = addMinutes(cursor, slotIntervalMinutes);
    }
  }

  return slots;
}

export function formatSlot(date: Date) {
  return format(date, "HH:mm");
}

export function formatDateLabel(date: Date) {
  return format(date, "EEE d MMM");
}

export function nextDays(count: number, from = new Date()): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(startOfDay(from), i));
}

export function parseLocalDate(isoDate: string): Date {
  return parse(isoDate, "yyyy-MM-dd", new Date());
}

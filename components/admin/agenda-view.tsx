"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AddAppointmentForm } from "@/components/admin/add-appointment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/database";

type Row = Appointment & {
  service?: { name: string };
  barber?: { name: string };
};

type ViewMode = "week" | "month";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AgendaView() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [appointments, setAppointments] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const range = useMemo(() => {
    if (view === "week") {
      const from = startOfWeek(cursor, { weekStartsOn: 1 });
      return { from, to: addDays(from, 7) };
    }
    const monthStart = startOfMonth(cursor);
    const from = startOfWeek(monthStart, { weekStartsOn: 1 });
    const to = addDays(
      endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
      1
    );
    return { from, to };
  }, [view, cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:services(name), barber:barbers(name)")
        .gte("start_datetime", range.from.toISOString())
        .lt("start_datetime", range.to.toISOString())
        .neq("status", "cancelled")
        .order("start_datetime");
      if (error) throw error;
      setAppointments((data as Row[]) || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const today = startOfDay(new Date());
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      if (isBefore(selectedDay, start) || isBefore(end, selectedDay)) {
        setSelectedDay(today >= start && today <= end ? today : start);
      }
    } else if (!isSameMonth(selectedDay, cursor)) {
      setSelectedDay(isSameMonth(today, cursor) ? today : startOfMonth(cursor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const a of appointments) {
      const key = format(new Date(a.start_datetime), "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const selectedItems = byDay.get(format(selectedDay, "yyyy-MM-dd")) || [];
  const isPastDay = isBefore(selectedDay, startOfDay(new Date()));

  useEffect(() => {
    if (isPastDay) setAdding(false);
  }, [isPastDay]);

  const title =
    view === "week"
      ? `Week of ${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMMM yyyy")}`
      : format(cursor, "MMMM yyyy");

  function goToday() {
    const today = startOfDay(new Date());
    setCursor(today);
    setSelectedDay(today);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Agenda</h1>
          <p className="mt-2 text-base text-muted-foreground">{title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-border p-1">
            {(["week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "px-4 py-2 text-sm capitalize transition",
                  view === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() =>
                setCursor((d) =>
                  view === "week" ? addDays(d, -7) : addMonths(d, -1)
                )
              }
              className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Button variant="outline" className="h-11 px-4" onClick={goToday}>
              Today
            </Button>
            <button
              type="button"
              aria-label="Next"
              onClick={() =>
                setCursor((d) =>
                  view === "week" ? addDays(d, 7) : addMonths(d, 1)
                )
              }
              className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : view === "week" ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-7">
          {weekDays.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const count = byDay.get(key)?.length || 0;
            const isToday = isSameDay(d, new Date());
            const selected = isSameDay(d, selectedDay);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={cn(
                  "flex min-h-[5.5rem] flex-col items-start justify-between border px-4 py-3 text-left transition sm:min-h-[7rem]",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50 hover:bg-card/50",
                  isToday && !selected && "border-primary/60"
                )}
              >
                <p
                  className={cn(
                    "font-display text-2xl leading-none",
                    selected ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      selected
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(d, "EEE")}
                  </span>{" "}
                  {format(d, "d")}
                </p>
                <p
                  className={cn(
                    "mt-3 text-sm",
                    selected
                      ? "text-primary-foreground/85"
                      : count
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                  )}
                >
                  {count === 0 ? "Free" : `${count} apt.`}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 border border-border p-4 sm:p-6">
          <div className="mb-3 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-sm text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const inMonth = isSameMonth(d, cursor);
              const count = byDay.get(key)?.length || 0;
              const isToday = isSameDay(d, new Date());
              const selected = isSameDay(d, selectedDay);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 border border-transparent p-2 transition sm:min-h-[5.5rem]",
                    !inMonth && "invisible",
                    inMonth && "hover:border-primary/40 hover:bg-primary/10",
                    selected &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary",
                    isToday && !selected && "border-primary/50"
                  )}
                >
                  <span className="font-display text-2xl leading-none sm:text-3xl">
                    {format(d, "d")}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      selected
                        ? "text-primary-foreground/85"
                        : count
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                    )}
                  >
                    {count > 0 ? count : "·"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">
              {format(selectedDay, "EEE d")}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">
              {format(selectedDay, "MMMM yyyy")}
              <span className="mx-2 text-border">·</span>
              {selectedItems.length === 0
                ? "No appointments"
                : `${selectedItems.length} appointment${selectedItems.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {!isPastDay && (
            <Button
              onClick={() => setAdding((v) => !v)}
              variant={adding ? "outline" : "default"}
            >
              {adding ? "Close form" : "Add appointment"}
            </Button>
          )}
        </div>

        {adding && !isPastDay && (
          <div className="mt-6">
            <AddAppointmentForm
              date={selectedDay}
              onCancel={() => setAdding(false)}
              onCreated={() => {
                setAdding(false);
                load();
              }}
            />
          </div>
        )}

        <div className="mt-6">
          {selectedItems.length === 0 && !adding ? (
            <div className="py-10">
              <EmptyState
                title={isPastDay ? "Past day" : "Free day"}
                description={
                  isPastDay
                    ? "You can view past appointments, but new ones can’t be added here."
                    : "Use Add appointment above, or pick another day."
                }
              />
            </div>
          ) : selectedItems.length === 0 ? null : (
            <ul className="divide-y divide-border">
              {selectedItems.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-4 py-5 transition hover:bg-card/30 sm:gap-6"
                >
                  <div className="w-20 shrink-0 sm:w-24">
                    <p className="font-display text-3xl leading-none text-primary">
                      {format(new Date(a.start_datetime), "HH:mm")}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-medium">
                      {a.customer_name || "Walk-in"}
                    </p>
                    <p className="mt-1 truncate text-base text-muted-foreground">
                      {a.service?.name || "Service"}
                      {a.barber?.name ? ` · ${a.barber.name}` : ""}
                    </p>
                  </div>
                  <Badge
                    className="px-3 py-1 text-sm"
                    variant={
                      a.status === "confirmed"
                        ? "success"
                        : a.status === "pending"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { EmptyState, Spinner } from "@/components/ui/states";
import { cn, formatPrice } from "@/lib/utils";
import type { Appointment } from "@/types/database";

type Row = Appointment & {
  service?: { name: string; price: number };
  barber?: { name: string };
};

const ACTIVE = new Set(["pending", "confirmed", "completed"]);

export default function StatsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("appointments")
          .select("*, service:services(name,price), barber:barbers(name)")
          .order("start_datetime", { ascending: false });
        setRows((data as Row[]) || []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const rangeStart = subDays(today, 13);

    const active = rows.filter((r) => ACTIVE.has(r.status));
    const inRange = (r: Row, from: Date) => {
      const d = new Date(r.start_datetime);
      return !isBefore(d, from);
    };

    const todayRows = active.filter((r) =>
      isSameDay(new Date(r.start_datetime), today)
    );
    const weekRows = active.filter((r) => inRange(r, weekStart));
    const monthRows = active.filter((r) => inRange(r, monthStart));

    const revenue = (list: Row[]) =>
      list.reduce((sum, r) => sum + Number(r.service?.price || 0), 0);

    const weekRev = revenue(weekRows);
    const monthRev = revenue(monthRows);
    const avgTicket =
      monthRows.length > 0 ? monthRev / monthRows.length : 0;

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const r of rows) {
      if (r.status in statusCounts) {
        statusCounts[r.status as keyof typeof statusCounts] += 1;
      }
    }
    const statusTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    const days = eachDayOfInterval({ start: rangeStart, end: today });
    const byDay = days.map((day) => {
      const list = active.filter((r) =>
        isSameDay(new Date(r.start_datetime), day)
      );
      return {
        day,
        label: format(day, "EEE"),
        short: format(day, "d"),
        count: list.length,
        revenue: revenue(list),
      };
    });
    const maxDay = Math.max(1, ...byDay.map((d) => d.count));

    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const r of monthRows) {
      const name = r.service?.name || "Unknown";
      const prev = serviceMap.get(name) || { count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += Number(r.service?.price || 0);
      serviceMap.set(name, prev);
    }
    const services = Array.from(serviceMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count);
    const maxService = Math.max(1, ...services.map((s) => s.count));

    const barberMap = new Map<string, { count: number; revenue: number }>();
    for (const r of monthRows) {
      const name = r.barber?.name || "Unassigned";
      const prev = barberMap.get(name) || { count: 0, revenue: 0 };
      prev.count += 1;
      prev.revenue += Number(r.service?.price || 0);
      barberMap.set(name, prev);
    }
    const barbers = Array.from(barberMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
    const maxBarberRev = Math.max(1, ...barbers.map((b) => b.revenue));

    const hourMap = new Map<number, number>();
    for (const r of monthRows) {
      const h = new Date(r.start_datetime).getHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }
    const hours = Array.from({ length: 12 }, (_, i) => i + 9).map((h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      count: hourMap.get(h) || 0,
    }));
    const maxHour = Math.max(1, ...hours.map((h) => h.count));
    const peakHour = [...hours].sort((a, b) => b.count - a.count)[0];

    const customers = new Set(
      active.map((r) => `${r.customer_phone}|${r.customer_email || ""}`)
    );

    const upcomingWeek = weekRows.filter((r) =>
      isAfter(new Date(r.start_datetime), now)
    ).length;
    const doneWeek = weekRows.length - upcomingWeek;

    const completionRate =
      statusTotal > 0
        ? Math.round((statusCounts.completed / statusTotal) * 100)
        : 0;

    return {
      todayCount: todayRows.length,
      todayRevenue: revenue(todayRows),
      weekCount: weekRows.length,
      monthCount: monthRows.length,
      weekRevenue: weekRev,
      monthRevenue: monthRev,
      avgTicket,
      uniqueCustomers: customers.size,
      upcomingWeek,
      doneWeek,
      completionRate,
      statusCounts,
      statusTotal,
      byDay,
      maxDay,
      services,
      maxService,
      barbers,
      maxBarberRev,
      hours,
      maxHour,
      peakHour,
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const empty = rows.length === 0;

  return (
    <div className="pb-8">
      <header className="border-b border-border pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Shop pulse</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy")} — bookings, revenue, and
          who is carrying the chair this month.
        </p>
      </header>

      {empty ? (
        <div className="mt-16">
          <EmptyState
            title="No appointments yet"
            description="Stats will fill in as bookings come through the agenda or the public site."
          />
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Today"
              value={String(stats.todayCount)}
              hint={formatPrice(stats.todayRevenue)}
              accent
            />
            <Kpi
              label="This week"
              value={String(stats.weekCount)}
              hint={`${stats.upcomingWeek} upcoming · ${stats.doneWeek} done`}
            />
            <Kpi
              label="Month revenue"
              value={formatPrice(stats.monthRevenue)}
              hint={`${stats.monthCount} appointments`}
            />
            <Kpi
              label="Avg ticket"
              value={formatPrice(stats.avgTicket)}
              hint={`${stats.uniqueCustomers} customers · ${stats.completionRate}% completed`}
            />
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <SectionTitle
                title="Last 14 days"
                subtitle="Daily booking volume"
              />
              <div className="mt-6 flex h-44 items-end gap-1.5 sm:gap-2">
                {stats.byDay.map((d) => {
                  const height = Math.max(
                    6,
                    Math.round((d.count / stats.maxDay) * 100)
                  );
                  const isToday = isSameDay(d.day, new Date());
                  return (
                    <div
                      key={d.day.toISOString()}
                      className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="invisible text-[10px] text-primary group-hover:visible">
                        {d.count || ""}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-sm transition-all duration-500",
                          isToday
                            ? "bg-primary"
                            : "bg-primary/35 group-hover:bg-primary/60"
                        )}
                        style={{ height: `${height}%` }}
                        title={`${format(d.day, "d MMM")}: ${d.count} · ${formatPrice(d.revenue)}`}
                      />
                      <div className="text-center leading-tight">
                        <p
                          className={cn(
                            "text-[10px] uppercase tracking-wide",
                            isToday
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {d.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {d.short}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionTitle
                title="Status mix"
                subtitle="All recorded appointments"
              />
              <div className="mt-6 space-y-4">
                {(
                  [
                    ["confirmed", "Confirmed", "bg-emerald-500/80"],
                    ["pending", "Pending", "bg-amber-500/80"],
                    ["completed", "Completed", "bg-primary/80"],
                    ["cancelled", "Cancelled", "bg-muted-foreground/40"],
                  ] as const
                ).map(([key, label, color]) => {
                  const count = stats.statusCounts[key];
                  const pct =
                    stats.statusTotal > 0
                      ? Math.round((count / stats.statusTotal) * 100)
                      : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span>{label}</span>
                        <span className="text-muted-foreground">
                          {count}
                          <span className="ml-2 text-xs">{pct}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {stats.peakHour && stats.peakHour.count > 0 && (
                <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
                  Peak hour this month:{" "}
                  <span className="text-foreground">
                    {stats.peakHour.label}
                  </span>{" "}
                  ({stats.peakHour.count} bookings)
                </p>
              )}
            </div>
          </section>

          <section className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <SectionTitle
                title="Services this month"
                subtitle="By booking count"
              />
              <div className="mt-5 space-y-4">
                {stats.services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  stats.services.map((s, i) => (
                    <div key={s.name}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm">
                          <span className="mr-2 font-display text-lg text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {s.name}
                        </p>
                        <p className="shrink-0 text-sm text-muted-foreground">
                          {s.count} · {formatPrice(s.revenue)}
                        </p>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-700"
                          style={{
                            width: `${(s.count / stats.maxService) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <SectionTitle
                title="Barbers this month"
                subtitle="Ranked by estimated revenue"
              />
              <div className="mt-5 space-y-4">
                {stats.barbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  stats.barbers.map((b, i) => (
                    <div key={b.name}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm">
                          <span className="mr-2 font-display text-lg text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {b.name}
                        </p>
                        <p className="shrink-0 text-sm text-muted-foreground">
                          {b.count} · {formatPrice(b.revenue)}
                        </p>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70 transition-all duration-700"
                          style={{
                            width: `${(b.revenue / stats.maxBarberRev) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="mt-12">
            <SectionTitle
              title="Busy hours"
              subtitle="When clients book this month (09:00–20:00)"
            />
            <div className="mt-6 flex h-32 items-end gap-1 sm:gap-1.5">
              {stats.hours.map((h) => {
                const height = Math.max(
                  h.count > 0 ? 8 : 3,
                  Math.round((h.count / stats.maxHour) * 100)
                );
                const isPeak =
                  stats.peakHour &&
                  h.hour === stats.peakHour.hour &&
                  stats.peakHour.count > 0;
                return (
                  <div
                    key={h.hour}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="invisible text-[10px] text-primary group-hover:visible">
                      {h.count || ""}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all duration-500",
                        isPeak
                          ? "bg-primary"
                          : h.count
                            ? "bg-primary/40 group-hover:bg-primary/65"
                            : "bg-muted"
                      )}
                      style={{ height: `${height}%` }}
                      title={`${h.label}: ${h.count}`}
                    />
                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                      {String(h.hour).padStart(2, "0")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-3">
            <MiniStat
              label="Week revenue"
              value={formatPrice(stats.weekRevenue)}
            />
            <MiniStat
              label="Month bookings"
              value={String(stats.monthCount)}
            />
            <MiniStat
              label="Unique customers"
              value={String(stats.uniqueCustomers)}
            />
          </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border p-5 transition",
        accent && "border-primary/40 bg-primary/5"
      )}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl md:text-4xl">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

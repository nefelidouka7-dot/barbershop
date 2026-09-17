"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isBefore } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Barber, TimeOff, WorkingHours } from "@/types/database";

/** Display order: Mon → Sun (JS day_of_week: 0=Sun … 6=Sat) */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

type DayDraft = {
  open: boolean;
  start: string;
  end: string;
  ids: string[];
};

function toDraft(hours: WorkingHours[]): Record<number, DayDraft> {
  const draft: Record<number, DayDraft> = {};
  for (const d of WEEK_ORDER) {
    draft[d] = { open: false, start: "09:00", end: "17:00", ids: [] };
  }
  for (const h of hours) {
    const start = h.start_time.slice(0, 5);
    const end = h.end_time.slice(0, 5);
    const existing = draft[h.day_of_week];
    if (!existing.open) {
      draft[h.day_of_week] = {
        open: true,
        start,
        end,
        ids: [h.id],
      };
    } else {
      // Keep earliest start / latest end if multiple windows
      draft[h.day_of_week] = {
        open: true,
        start: start < existing.start ? start : existing.start,
        end: end > existing.end ? end : existing.end,
        ids: [...existing.ids, h.id],
      };
    }
  }
  return draft;
}

export default function HoursAdminPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState("");
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [offs, setOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<number, DayDraft>>(toDraft([]));
  const [offStart, setOffStart] = useState("");
  const [offEnd, setOffEnd] = useState("");
  const [reason, setReason] = useState("");
  const [savingOff, setSavingOff] = useState(false);

  const selectedBarber = barbers.find((b) => b.id === barberId);

  const { upcomingOffs, pastOffs } = useMemo(() => {
    const now = new Date();
    const upcoming: TimeOff[] = [];
    const past: TimeOff[] = [];
    for (const o of offs) {
      if (isBefore(new Date(o.end_datetime), now)) past.push(o);
      else upcoming.push(o);
    }
    return { upcomingOffs: upcoming, pastOffs: past };
  }, [offs]);

  const loadBarbers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("barbers")
        .select("*")
        .eq("active", true)
        .order("name");
      const list = (data as Barber[]) || [];
      setBarbers(list);
      setBarberId((prev) => prev || list[0]?.id || "");
    } catch {
      setBarbers([]);
    }
  }, []);

  const load = useCallback(async () => {
    if (!barberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: h }, { data: t }] = await Promise.all([
        supabase
          .from("working_hours")
          .select("*")
          .eq("barber_id", barberId)
          .order("day_of_week"),
        supabase
          .from("time_off")
          .select("*")
          .eq("barber_id", barberId)
          .order("start_datetime", { ascending: true }),
      ]);
      const list = (h as WorkingHours[]) || [];
      setHours(list);
      setDraft(toDraft(list));
      setOffs((t as TimeOff[]) || []);
    } catch {
      setHours([]);
      setDraft(toDraft([]));
      setOffs([]);
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  useEffect(() => {
    load();
  }, [load]);

  function updateDay(day: number, patch: Partial<DayDraft>) {
    setDraft((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  }

  const weekChanged = useMemo(() => {
    const saved = toDraft(hours);
    return WEEK_ORDER.some((day) => {
      const a = draft[day];
      const b = saved[day];
      if (!a || !b) return false;
      return (
        a.open !== b.open ||
        (a.open && (a.start !== b.start || a.end !== b.end))
      );
    });
  }, [draft, hours]);

  async function saveWeek() {
    if (!barberId) return;

    for (const day of WEEK_ORDER) {
      const row = draft[day];
      if (row.open && row.end <= row.start) {
        toast({
          title: "Invalid hours",
          description: `${DAY_LABELS[day]}: end time must be after start.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("working_hours").delete().eq("barber_id", barberId);

      const rows = WEEK_ORDER.filter((day) => draft[day].open).map((day) => ({
        barber_id: barberId,
        day_of_week: day,
        start_time: draft[day].start,
        end_time: draft[day].end,
      }));

      if (rows.length) {
        const { error } = await supabase.from("working_hours").insert(rows);
        if (error) throw error;
      }

      toast({ title: "Schedule saved" });
      await load();
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSaving(false);
    }
  }

  function applyWeekdaysPreset() {
    setDraft((prev) => {
      const next = { ...prev };
      for (const d of WEEK_ORDER) {
        if (d === 0) {
          next[d] = { ...next[d], open: false };
        } else {
          next[d] = {
            open: true,
            start: "09:00",
            end: "17:00",
            ids: next[d]?.ids || [],
          };
        }
      }
      return next;
    });
    toast({ title: "Preset applied — press Save" });
  }

  async function addOff() {
    if (!offStart || !offEnd) {
      toast({ title: "Pick start and end" });
      return;
    }
    if (new Date(offEnd) <= new Date(offStart)) {
      toast({ title: "End must be after start" });
      return;
    }
    setSavingOff(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("time_off").insert({
        barber_id: barberId,
        start_datetime: new Date(offStart).toISOString(),
        end_datetime: new Date(offEnd).toISOString(),
        reason: reason.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Time blocked" });
      setOffStart("");
      setOffEnd("");
      setReason("");
      await load();
    } catch (e) {
      toast({
        title: "Could not block time",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSavingOff(false);
    }
  }

  async function removeOff(id: string) {
    const supabase = createClient();
    await supabase.from("time_off").delete().eq("id", id);
    toast({ title: "Block removed" });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl">Schedule</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Set when this barber is available each week, then block vacations or
          breaks so customers can’t book those times.
        </p>
      </header>

      {/* Barber picker */}
      <div className="mt-8">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Barber
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {barbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active barbers yet.</p>
          ) : (
            barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarberId(b.id)}
                className={cn(
                  "border px-4 py-2 text-sm transition",
                  barberId === b.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {b.name}
              </button>
            ))
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !barberId ? null : (
        <div className="mt-12 space-y-14">
          {/* Weekly hours */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Weekly hours</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open or close each day for{" "}
                  <span className="text-foreground">
                    {selectedBarber?.name || "this barber"}
                  </span>
                  , then save once.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={applyWeekdaysPreset}
              >
                Use Mon–Sat 09:00–17:00
              </Button>
            </div>

            <div className="mt-6 overflow-hidden border border-border">
              {WEEK_ORDER.map((day, i) => {
                const row = draft[day];

                return (
                  <div
                    key={day}
                    className={cn(
                      "grid items-center gap-3 px-4 py-3 sm:grid-cols-[7rem_1fr]",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <div>
                      <p className="font-medium">{DAY_LABELS[day]}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {row.open ? `${row.start} – ${row.end}` : "Closed"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateDay(day, { open: !row.open })}
                        className={cn(
                          "border px-3 py-1.5 text-xs transition",
                          row.open
                            ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-200"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {row.open ? "Open" : "Closed"}
                      </button>

                      {row.open ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Input
                            type="time"
                            value={row.start}
                            onChange={(e) =>
                              updateDay(day, { start: e.target.value })
                            }
                            className="h-9 w-[7.5rem]"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={row.end}
                            onChange={(e) =>
                              updateDay(day, { end: e.target.value })
                            }
                            className="h-9 w-[7.5rem]"
                          />
                        </div>
                      ) : (
                        <p className="hidden text-sm text-muted-foreground sm:block">
                          Not bookable this day
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={saveWeek} disabled={saving || !weekChanged}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </section>

          {/* Time off */}
          <section>
            <div>
              <h2 className="font-display text-2xl">Time off</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Block a range for vacation, lunch, or a break. Bookings won’t be
                offered in that window.
              </p>
            </div>

            <div className="mt-6 border border-border bg-card/20 p-5">
              <p className="text-sm font-medium">Add a block</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="off-start">From</Label>
                  <Input
                    id="off-start"
                    type="datetime-local"
                    value={offStart}
                    onChange={(e) => setOffStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="off-end">Until</Label>
                  <Input
                    id="off-end"
                    type="datetime-local"
                    value={offEnd}
                    onChange={(e) => setOffEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="off-reason">Reason (optional)</Label>
                <Input
                  id="off-reason"
                  placeholder="Vacation, lunch, doctor…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                className="mt-4"
                onClick={addOff}
                disabled={savingOff}
              >
                {savingOff ? "Saving…" : "Block this time"}
              </Button>
            </div>

            <div className="mt-8 space-y-8">
              <OffList
                title="Upcoming"
                empty="No upcoming blocks"
                items={upcomingOffs}
                onRemove={removeOff}
              />
              {pastOffs.length > 0 && (
                <OffList
                  title="Past"
                  empty=""
                  items={pastOffs}
                  onRemove={removeOff}
                  muted
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function OffList({
  title,
  empty,
  items,
  onRemove,
  muted,
}: {
  title: string;
  empty: string;
  items: TimeOff[];
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div className={cn(muted && "opacity-70")}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border border-border">
          {items.map((o) => {
            const start = new Date(o.start_datetime);
            const end = new Date(o.end_datetime);
            return (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {format(start, "EEE d MMM · HH:mm")}
                    <span className="text-muted-foreground"> → </span>
                    {format(end, "EEE d MMM · HH:mm")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.reason || "No reason noted"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(o.id)}
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

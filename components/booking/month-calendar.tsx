"use client";

import { useMemo, useState } from "react";
import {
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
import { el, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function MonthCalendar({
  value,
  onChange,
  monthsAhead = 6,
}: {
  value: string; // yyyy-MM-dd
  onChange: (isoDate: string) => void;
  /** How many months into the future user can navigate */
  monthsAhead?: number;
}) {
  const { locale, dict } = useLocale();
  const dateLocale = locale === "el" ? el : enUS;
  const today = startOfDay(new Date());
  const selected = startOfDay(new Date(value + "T12:00:00"));
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(selected));

  const minMonth = startOfMonth(today);
  const maxMonth = startOfMonth(addMonths(today, monthsAhead));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const canPrev = visibleMonth > minMonth;
  const canNext = visibleMonth < maxMonth;

  return (
    <div className="border border-border/80 bg-card/30 p-3 sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={dict.calendar.prevMonth}
          disabled={!canPrev}
          onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
          className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-xl tracking-wide">
          {format(visibleMonth, "LLLL yyyy", { locale: dateLocale })}
        </p>
        <button
          type="button"
          aria-label={dict.calendar.nextMonth}
          disabled={!canNext}
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {dict.calendar.weekdays.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, visibleMonth);
          const past = isBefore(day, today);
          const active = isSameDay(day, selected);
          const disabled = past || !inMonth;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(format(day, "yyyy-MM-dd"))}
              className={cn(
                "aspect-square text-sm transition-all duration-300 ease-soft",
                !inMonth && "invisible",
                inMonth &&
                  !past &&
                  !active &&
                  "text-foreground/90 hover:border hover:border-primary/50 hover:bg-primary/10",
                past && inMonth && "cursor-not-allowed text-muted-foreground/35",
                active &&
                  "bg-primary font-medium text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {dict.calendar.selected} ·{" "}
        {format(selected, "EEEE d MMMM yyyy", { locale: dateLocale })}
      </p>
    </div>
  );
}

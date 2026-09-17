"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { el, enUS } from "date-fns/locale";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { createClient } from "@/lib/supabase/client";
import { translateServiceName } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/database";

type Row = Appointment & {
  service?: { name: string; duration_minutes?: number };
  barber?: { name: string };
};

export default function AccountPage() {
  const { locale, dict } = useLocale();
  const t = dict.account;
  const dateLocale = locale === "el" ? el : enUS;
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<{ start: string; label: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const loadRows = useCallback(async (userMail: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("appointments")
      .select("*, service:services(name,duration_minutes), barber:barbers(name)")
      .ilike("customer_email", userMail)
      .order("start_datetime", { ascending: false });
    setRows((data as Row[]) || []);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
        if (user?.email) await loadRows(user.email);
      } catch {
        setUserEmail(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadRows]);

  useEffect(() => {
    if (!rescheduleId) return;
    const appt = rows.find((r) => r.id === rescheduleId);
    if (!appt) return;

    async function loadSlots() {
      setSlotsLoading(true);
      setPicked(null);
      try {
        const res = await fetch(
          `/api/availability?barber_id=${appt!.barber_id}&service_id=${appt!.service_id}&date=${date}`
        );
        const json = await res.json();
        setSlots(json.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [rescheduleId, date, rows]);

  async function sendMagicLink() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    if (error) toast({ title: t.toastFailed, description: error.message });
    else setMagicSent(true);
  }

  async function cancel(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error)
      toast({ title: t.toastCancelFailed, description: error.message });
    else {
      toast({ title: t.toastCancelled });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
    }
  }

  async function confirmReschedule() {
    if (!rescheduleId || !picked) return;
    const res = await fetch("/api/bookings/reschedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointment_id: rescheduleId,
        start_datetime: picked,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast({ title: t.toastRescheduleFailed, description: json.error });
      return;
    }
    toast({ title: t.toastRescheduled });
    setRescheduleId(null);
    if (userEmail) await loadRows(userEmail);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setRows([]);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-28 md:px-8">
        <h1 className="font-display text-4xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : !userEmail ? (
          <div className="mt-10 space-y-4">
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
              />
            </div>
            <Button onClick={sendMagicLink} disabled={!email || magicSent}>
              {magicSent ? t.checkInbox : t.sendMagic}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.orBookGuest}{" "}
              <Link
                href="/book"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t.bookAsGuest}
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <Button variant="outline" size="sm" onClick={logout}>
                {t.signOut}
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {rows.length === 0 ? (
                <EmptyState title={t.noBookings} />
              ) : (
                rows.map((a) => {
                  const upcoming =
                    ["pending", "confirmed"].includes(a.status) &&
                    new Date(a.start_datetime) > new Date();
                  return (
                    <div
                      key={a.id}
                      className="border border-border px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {a.service?.name
                              ? translateServiceName(
                                  a.service.name,
                                  locale,
                                  dict
                                )
                              : ""}{" "}
                            · {a.barber?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(a.start_datetime),
                              "EEE d MMM · HH:mm",
                              { locale: dateLocale }
                            )}{" "}
                            · {a.status}
                          </p>
                        </div>
                        {upcoming && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRescheduleId(a.id)}
                            >
                              {t.reschedule}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancel(a.id)}
                            >
                              {t.cancel}
                            </Button>
                          </div>
                        )}
                      </div>

                      {rescheduleId === a.id && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="mb-2 text-sm text-muted-foreground">
                            {t.pickNewTime}
                          </p>
                          <MonthCalendar
                            value={date}
                            onChange={setDate}
                            monthsAhead={6}
                          />
                          {slotsLoading ? (
                            <div className="flex justify-center py-6">
                              <Spinner />
                            </div>
                          ) : (
                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {slots.map((s) => (
                                <button
                                  key={s.start}
                                  type="button"
                                  onClick={() => setPicked(s.start)}
                                  className={cn(
                                    "border py-2 text-sm",
                                    picked === s.start
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border"
                                  )}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              disabled={!picked}
                              onClick={confirmReschedule}
                            >
                              {t.confirmNewTime}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRescheduleId(null)}
                            >
                              {t.close}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

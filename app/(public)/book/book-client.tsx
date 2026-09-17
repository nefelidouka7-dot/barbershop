"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { el, enUS } from "date-fns/locale";
import { z } from "zod";
import { useLocale } from "@/components/i18n/locale-provider";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner, EmptyState } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { MonthCalendar } from "@/components/booking/month-calendar";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEMO_BARBERS,
  DEMO_SERVICES,
  demoServicesForBarber,
  withTimeout,
} from "@/lib/demo-data";
import { withGenericStaff } from "@/lib/staff-display";
import {
  interpolate,
  translateBio,
  translateServiceName,
} from "@/lib/i18n/dictionaries";
import { cn, formatPrice } from "@/lib/utils";
import { bookLog } from "@/lib/book-log";
import type { Barber, Service } from "@/types/database";

type Step = "barber" | "service" | "datetime" | "details" | "done";

type Details = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
};

export default function BookPage() {
  const { locale, dict } = useLocale();
  const t = dict.book;
  const dateLocale = locale === "el" ? el : enUS;
  const search = useSearchParams();
  const configured = isSupabaseConfigured();
  const [step, setStep] = useState<Step>("barber");
  const [barbers, setBarbers] = useState<Barber[]>(
    configured ? [] : withGenericStaff(DEMO_BARBERS)
  );
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(configured);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Date[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showSlotSkeleton, setShowSlotSkeleton] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const detailsSchema = useMemo(
    () =>
      z.object({
        customer_name: z
          .string()
          .trim()
          .refine((v) => v.length === 0 || v.length >= 2, {
            message: dict.validation.nameShort,
          }),
        customer_phone: z
          .string()
          .trim()
          .min(8, dict.validation.phoneInvalid),
        customer_email: z
          .string()
          .email(dict.validation.emailInvalid)
          .optional()
          .or(z.literal("")),
      }),
    [dict.validation]
  );

  const form = useForm<Details>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
    },
  });

  useEffect(() => {
    bookLog.info("init", "Supabase configured?", { configured });

    if (!configured) {
      setBarbers(withGenericStaff(DEMO_BARBERS));
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const result = await withTimeout(
          supabase.from("barbers").select("*").eq("active", true).order("name"),
          4000
        );
        if (cancelled) return;

        const { data, error } = result as {
          data: Barber[] | null;
          error: { message: string } | null;
        };

        if (error) {
          bookLog.error("barbers", "Supabase error", error);
          toast({ title: t.toastBarbersError, description: error.message });
          setBarbers(withGenericStaff(DEMO_BARBERS));
          return;
        }

        if (!data?.length) {
          bookLog.warn("barbers", "Empty result — using demo barbers");
          setBarbers(withGenericStaff(DEMO_BARBERS));
        } else {
          bookLog.info(
            "barbers",
            `Loaded ${data.length} barbers`,
            data.map((b) => b.name)
          );
          setBarbers(withGenericStaff(data));
        }
      } catch (e) {
        bookLog.error("barbers", "Failed / timeout", e);
        toast({
          title: t.toastSupabaseUnreachable,
          description:
            e instanceof Error ? e.message : t.toastUsingDemoBarbers,
        });
        if (!cancelled) setBarbers(withGenericStaff(DEMO_BARBERS));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [configured, t.toastBarbersError, t.toastSupabaseUnreachable, t.toastUsingDemoBarbers]);

  useEffect(() => {
    const preset = search.get("barber");
    if (!preset || !barbers.length) return;
    const found = barbers.find((b) => b.id === preset);
    if (found) {
      bookLog.info("preset", `Preselected barber ${found.name}`);
      setBarber(found);
      setStep("service");
    } else {
      bookLog.warn("preset", `Barber id not found: ${preset}`);
    }
  }, [search, barbers]);

  useEffect(() => {
    if (!barber) return;
    let cancelled = false;

    async function loadServices() {
      bookLog.info("services", `Loading for ${barber!.name}`, { id: barber!.id });
      setServicesLoading(true);
      setServices([]);

      if (!configured) {
        const demo = demoServicesForBarber(barber!.id);
        bookLog.info("services", `Demo services: ${demo.length}`);
        setServices(demo);
        setServicesLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const [linksRes, svcRes] = await withTimeout(
          Promise.all([
            supabase
              .from("barber_services")
              .select("service_id")
              .eq("barber_id", barber!.id),
            supabase.from("services").select("*").eq("active", true),
          ]),
          4000
        );

        if (cancelled) return;

        const links = linksRes as {
          data: { service_id: string }[] | null;
          error: { message: string } | null;
        };
        const svc = svcRes as {
          data: Service[] | null;
          error: { message: string } | null;
        };

        if (links.error) {
          bookLog.error("services", "barber_services error", links.error);
          toast({ title: "barber_services error", description: links.error.message });
        }
        if (svc.error) {
          bookLog.error("services", "services table error", svc.error);
          toast({ title: "services error", description: svc.error.message });
        }

        const ids = (links.data || []).map((l) => l.service_id);
        const list = svc.data?.length ? svc.data : DEMO_SERVICES;

        bookLog.info("services", "Raw data", {
          linkCount: ids.length,
          serviceCount: list.length,
        });

        let next: Service[];
        if (ids.length) {
          const filtered = list.filter((s) => ids.includes(s.id));
          next = filtered.length ? filtered : demoServicesForBarber(barber!.id);
          if (!filtered.length) {
            bookLog.warn("services", "Filter matched 0 — demo fallback");
          }
        } else {
          next = list.length ? list : demoServicesForBarber(barber!.id);
          bookLog.warn("services", "No barber_services rows — showing all");
        }

        bookLog.info("services", `Showing ${next.length} services`);
        setServices(next);
      } catch (e) {
        bookLog.error("services", "Failed / timeout", e);
        toast({
          title: t.toastServicesFailed,
          description:
            e instanceof Error ? e.message : t.toastUsingDemoServices,
        });
        if (!cancelled) setServices(demoServicesForBarber(barber!.id));
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, [barber, configured, t.toastServicesFailed, t.toastUsingDemoServices]);

  useEffect(() => {
    if (step !== "datetime" || !barber || !service) return;
    let cancelled = false;

    setSlot(null);
    setSlots([]);
    setSlotsLoading(true);
    setShowSlotSkeleton(false);

    const skeletonTimer = window.setTimeout(() => {
      if (!cancelled) setShowSlotSkeleton(true);
    }, 180);

    (async () => {
      try {
        bookLog.info("slots", "Fetching availability", {
          barber: barber.id,
          service: service.id,
          date,
        });
        const res = await fetch(
          `/api/availability?barber_id=${barber.id}&service_id=${service.id}&date=${date}`
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error || "Failed to load slots");
        bookLog.info("slots", `Got ${json.slots?.length ?? 0} slots`, {
          demo: json.demo,
        });
        setSlots(
          (json.slots as { start: string; label: string }[]).map(
            (s) => new Date(s.start)
          )
        );
      } catch (e) {
        bookLog.error("slots", "Availability failed", e);
        if (cancelled) return;
        setSlots([]);
        toast({
          title: t.toastSlotsFailed,
          description:
            e instanceof Error ? e.message : t.toastTryOtherDate,
        });
      } finally {
        window.clearTimeout(skeletonTimer);
        if (!cancelled) {
          setSlotsLoading(false);
          setShowSlotSkeleton(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(skeletonTimer);
    };
  }, [step, barber, service, date, t.toastSlotsFailed, t.toastTryOtherDate]);

  async function onSubmit(values: Details) {
    if (!barber || !service || !slot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barber_id: barber.id,
          service_id: service.id,
          start_datetime: slot.toISOString(),
          ...values,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        bookLog.error("booking", "API error", json);
        throw new Error(json.error || "Booking failed");
      }
      bookLog.info("booking", "Success", json);
      setBookingId(json.id);
      setStep("done");
      toast({
        title: json.demo ? t.toastDemoBooked : t.toastBooked,
        description: json.demo ? t.toastDemoHint : t.toastConfirmSent,
      });
    } catch (e) {
      toast({
        title: t.toastCouldNotBook,
        description: e instanceof Error ? e.message : t.toastTryOtherSlot,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const stepMeta = [
    { id: "barber" as const, label: t.stepBarber },
    { id: "service" as const, label: t.stepService },
    { id: "datetime" as const, label: t.stepDatetime },
    { id: "details" as const, label: t.stepDetails },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8">
        <h1 className="font-display text-4xl md:text-5xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {t.subtitle}
        </p>
        <StepIndicator step={step} steps={stepMeta} />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <>
            {step === "barber" && (
              <div key="barber" className="book-step mt-10">
                <StepIntro
                  title={t.pickBarberTitle}
                  description={t.pickBarberDesc}
                />
                <div className="grid gap-4">
                  {barbers.map((b, i) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        bookLog.info("ui", `Selected barber ${b.name}`, { id: b.id });
                        setBarber(b);
                        setService(null);
                        setServices([]);
                        setStep("service");
                      }}
                      className="book-item select-row flex gap-4 p-3 text-left"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden">
                        {b.photo_url && (
                          <Image
                            src={b.photo_url}
                            alt={b.name}
                            fill
                            className="object-cover transition duration-500 ease-soft group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-display text-2xl">{b.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {translateBio(b.bio, locale, dict)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "service" && barber && (
              <div key="service" className="book-step mt-10">
                <Back label={t.back} onClick={() => setStep("barber")} />
                <StepIntro
                  title={t.pickServiceTitle}
                  description={interpolate(t.pickServiceDesc, {
                    name: barber.name,
                  })}
                />
                {servicesLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner />
                  </div>
                ) : services.length === 0 ? (
                  <EmptyState
                    title={t.noServicesTitle}
                    description={t.noServicesDesc}
                  />
                ) : (
                  <div className="grid gap-3">
                    {services.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        className="book-item select-row flex items-center justify-between px-4 py-4 text-left"
                        style={{ animationDelay: `${i * 45}ms` }}
                        onClick={() => {
                          bookLog.info("ui", `Selected service ${s.name}`, { id: s.id });
                          setService(s);
                          setStep("datetime");
                        }}
                      >
                        <div>
                          <p className="font-medium">
                            {translateServiceName(s.name, locale, dict)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {s.duration_minutes} {t.minutes}
                          </p>
                        </div>
                        <p className="text-primary transition-colors duration-300">
                          {formatPrice(s.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "datetime" && barber && service && (
              <div key="datetime" className="book-step mt-10">
                <Back label={t.back} onClick={() => setStep("service")} />
                <StepIntro
                  title={t.pickDatetimeTitle}
                  description={interpolate(t.pickDatetimeDesc, {
                    service: translateServiceName(service.name, locale, dict),
                    barber: barber.name,
                    minutes: service.duration_minutes,
                    price: formatPrice(service.price),
                  })}
                />
                <MonthCalendar
                  value={date}
                  onChange={(next) => {
                    bookLog.info("ui", "Selected date", { date: next });
                    setDate(next);
                  }}
                  monthsAhead={6}
                />
                <p className="mt-6 text-sm font-medium text-foreground">
                  {t.availableTimes}
                </p>
                <div className="mt-3 min-h-[9.5rem]">
                  {slotsLoading && showSlotSkeleton ? (
                    <div
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                      aria-busy="true"
                      aria-label={t.loadingTimes}
                    >
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[42px] animate-pulse border border-border/50 bg-muted/35"
                        />
                      ))}
                    </div>
                  ) : slotsLoading ? (
                    <div className="h-[9.5rem]" aria-busy="true" />
                  ) : slots.length === 0 ? (
                    <EmptyState
                      title={t.noSlotsTitle}
                      description={t.noSlotsDesc}
                    />
                  ) : (
                    <div
                      key={date}
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                    >
                      {slots.map((s, i) => {
                        const active = slot?.getTime() === s.getTime();
                        return (
                          <button
                            key={s.toISOString()}
                            type="button"
                            onClick={() => setSlot(s)}
                            className={cn(
                              "book-item select-chip py-2.5 text-sm",
                              active && "select-chip-active"
                            )}
                            style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
                          >
                            {format(s, "HH:mm")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "mt-8 transition-all duration-500 ease-soft",
                    slot
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-2 opacity-40"
                  )}
                >
                  <Button
                    className="w-full transition-transform duration-300 ease-soft active:scale-[0.98]"
                    size="lg"
                    disabled={!slot}
                    onClick={() => setStep("details")}
                  >
                    {t.continue}
                  </Button>
                </div>
              </div>
            )}

            {step === "details" && barber && service && slot && (
              <form
                key="details"
                className="book-step mt-10 space-y-5"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Back label={t.back} onClick={() => setStep("datetime")} />
                <StepIntro
                  title={t.detailsTitle}
                  description={t.detailsDesc}
                />
                <div className="border border-border/80 bg-card/40 p-4 text-sm transition-colors duration-300">
                  <p className="font-display text-xl">{barber.name}</p>
                  <p className="mt-1 text-muted-foreground">
                    {translateServiceName(service.name, locale, dict)} ·{" "}
                    {format(slot, "EEE d MMM · HH:mm", { locale: dateLocale })} ·{" "}
                    {formatPrice(service.price)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">{t.nameOptional}</Label>
                  <Input id="customer_name" {...form.register("customer_name")} />
                  {form.formState.errors.customer_name && (
                    <p className="text-xs text-red-300">
                      {form.formState.errors.customer_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">{t.phone}</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    required
                    {...form.register("customer_phone")}
                  />
                  {form.formState.errors.customer_phone && (
                    <p className="text-xs text-red-300">
                      {form.formState.errors.customer_phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">{t.emailOptional}</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    {...form.register("customer_email")}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full transition-transform duration-300 ease-soft active:scale-[0.98]"
                  disabled={submitting}
                >
                  {submitting ? <Spinner className="mr-2" /> : null}
                  {t.confirm}
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="mt-16 animate-fade-up text-center">
                <p className="font-display text-4xl">{t.doneTitle}</p>
                <p className="mt-3 text-muted-foreground">
                  {barber?.name} ·{" "}
                  {service
                    ? translateServiceName(service.name, locale, dict)
                    : ""}
                  {slot
                    ? ` · ${format(slot, "EEE d MMM · HH:mm", { locale: dateLocale })}`
                    : ""}
                </p>
                {bookingId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.bookingCode} {bookingId.slice(0, 8)}
                  </p>
                )}
                <Button asChild className="mt-8">
                  <Link href="/">{t.backHome}</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StepIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl leading-snug md:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Back({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 text-sm text-muted-foreground hover:text-foreground"
    >
      {label}
    </button>
  );
}

function StepIndicator({
  step,
  steps,
}: {
  step: Step;
  steps: { id: Step; label: string }[];
}) {
  if (step === "done") return null;
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="mt-6 space-y-2">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500 ease-soft",
              i <= idx ? "scale-y-125 bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between gap-2 text-[11px] text-muted-foreground sm:text-xs">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "min-w-0 flex-1 truncate transition-colors duration-300",
              i === idx ? "font-medium text-foreground" : i < idx ? "text-primary/80" : ""
            )}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

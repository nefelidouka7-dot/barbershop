"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { cn, formatPrice } from "@/lib/utils";
import type { Barber, Service } from "@/types/database";

export function AddAppointmentForm({
  date,
  onCreated,
  onCancel,
}: {
  date: Date;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<{ start: string; label: string }[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [dayClosed, setDayClosed] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateKey = format(date, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const supabase = createClient();
        const [{ data: b }, { data: s }] = await Promise.all([
          supabase.from("barbers").select("*").eq("active", true).order("name"),
          supabase.from("services").select("*").eq("active", true).order("name"),
        ]);
        if (cancelled) return;
        const barberList = (b as Barber[]) || [];
        const serviceList = (s as Service[]) || [];
        setBarbers(barberList);
        setServices(serviceList);
        setBarberId(barberList[0]?.id || "");
        setServiceId(serviceList[0]?.id || "");
      } catch {
        if (!cancelled) {
          setBarbers([]);
          setServices([]);
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!barberId || !serviceId) return;
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setSlot(null);
      try {
        const res = await fetch(
          `/api/availability?barber_id=${barberId}&service_id=${serviceId}&date=${dateKey}&admin=1`
        );
        const json = await res.json();
        if (cancelled) return;
        setSlots(json.slots || []);
        setDayClosed(Boolean(json.closed));
      } catch {
        if (!cancelled) {
          setSlots([]);
          setDayClosed(false);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [barberId, serviceId, dateKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!barberId || !serviceId) {
      toast({ title: "Pick barber and service" });
      return;
    }
    if (name.trim() && name.trim().length < 2) {
      toast({ title: "Name is too short" });
      return;
    }
    if (phone.trim() && phone.trim().length < 8) {
      toast({ title: "Phone looks too short" });
      return;
    }

    let startIso = slot;
    if (!startIso && customTime) {
      const local = new Date(`${dateKey}T${customTime}:00`);
      if (Number.isNaN(local.getTime())) {
        toast({ title: "Invalid time" });
        return;
      }
      startIso = local.toISOString();
    }
    if (!startIso) {
      toast({ title: "Pick a time slot or enter a time" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barber_id: barberId,
          service_id: serviceId,
          start_datetime: startIso,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim(),
          admin: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      toast({
        title: "Appointment added",
        description: format(new Date(startIso), "EEE d MMM · HH:mm"),
      });
      onCreated();
    } catch (err) {
      toast({
        title: "Could not add appointment",
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingMeta) {
    return (
      <div className="flex justify-center border border-border py-10">
        <Spinner />
      </div>
    );
  }

  if (!barbers.length || !services.length) {
    return (
      <div className="border border-border px-4 py-6 text-sm text-muted-foreground">
        Add at least one barber and one service first.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 border border-border bg-card/20 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl">New appointment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(date, "EEEE d MMMM yyyy")}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admin-barber">Barber</Label>
          <select
            id="admin-barber"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-service">Service</Label>
          <select
            id="admin-service"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes}m · {formatPrice(s.price)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Available times</Label>
        {dayClosed && !loadingSlots && (
          <p className="mt-1 text-xs text-amber-200/90">
            No schedule for this day — showing default 09:00–20:00. Update
            Schedule to set real hours.
          </p>
        )}
        {loadingSlots ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : slots.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            All listed times are taken — enter a custom time below.
          </p>
        ) : (
          <div className="mt-2 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {slots.map((s) => (
              <button
                key={s.start}
                type="button"
                onClick={() => {
                  setSlot(s.start);
                  setCustomTime("");
                }}
                className={cn(
                  "border py-2.5 text-sm transition",
                  slot === s.start
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-time">Or custom time</Label>
        <Input
          id="custom-time"
          type="time"
          value={customTime}
          onChange={(e) => {
            setCustomTime(e.target.value);
            setSlot(null);
          }}
          className="max-w-[10rem]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cust-name">Customer name (optional)</Label>
          <Input
            id="cust-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-phone">Phone (optional)</Label>
          <Input
            id="cust-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cust-email">Email (optional)</Label>
        <Input
          id="cust-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : "Add appointment"}
      </Button>
    </form>
  );
}

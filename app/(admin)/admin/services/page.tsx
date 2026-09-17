"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { serviceSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, Spinner } from "@/components/ui/states";
import { toast } from "@/components/ui/use-toast";
import { formatPrice } from "@/lib/utils";
import type { Barber, Service } from "@/types/database";

type Form = z.infer<typeof serviceSchema>;

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [links, setLinks] = useState<{ barber_id: string; service_id: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const form = useForm<Form>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      duration_minutes: 30,
      price: 20,
      active: true,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: s }, { data: b }, { data: l }] = await Promise.all([
        supabase.from("services").select("*").order("name"),
        supabase.from("barbers").select("*").eq("active", true),
        supabase.from("barber_services").select("*"),
      ]);
      setServices((s as Service[]) || []);
      setBarbers((b as Barber[]) || []);
      setLinks(l || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(values: Form) {
    const supabase = createClient();
    const { error } = await supabase.from("services").insert(values);
    if (error) toast({ title: "Failed", description: error.message });
    else {
      toast({ title: "Service created" });
      form.reset({ name: "", duration_minutes: 30, price: 20, active: true });
      load();
    }
  }

  async function toggleActive(svc: Service) {
    const supabase = createClient();
    await supabase
      .from("services")
      .update({ active: !svc.active })
      .eq("id", svc.id);
    load();
  }

  async function toggleLink(barberId: string, serviceId: string, on: boolean) {
    const supabase = createClient();
    if (on) {
      await supabase
        .from("barber_services")
        .insert({ barber_id: barberId, service_id: serviceId });
    } else {
      await supabase
        .from("barber_services")
        .delete()
        .eq("barber_id", barberId)
        .eq("service_id", serviceId);
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Services</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <section className="space-y-3">
          {services.length === 0 ? (
            <EmptyState title="No services" />
          ) : (
            services.map((s) => (
              <div key={s.id} className="border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {s.name}{" "}
                      {!s.active && (
                        <span className="text-xs text-muted-foreground">(inactive)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.duration_minutes} min · {formatPrice(s.price)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>
                    {s.active ? "Disable" : "Enable"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {barbers.map((b) => {
                    const on = links.some(
                      (l) => l.barber_id === b.id && l.service_id === s.id
                    );
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleLink(b.id, s.id, !on)}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          on
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {b.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        <form
          className="space-y-4 border border-border p-5"
          onSubmit={form.handleSubmit(onCreate)}
        >
          <h2 className="font-display text-2xl">Add service</h2>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" {...form.register("duration_minutes")} />
          </div>
          <div className="space-y-2">
            <Label>Price (€)</Label>
            <Input type="number" step="0.01" {...form.register("price")} />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </div>
    </div>
  );
}

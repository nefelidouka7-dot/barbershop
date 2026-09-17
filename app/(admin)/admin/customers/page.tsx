"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { EmptyState, Spinner } from "@/components/ui/states";
import type { Appointment } from "@/types/database";

type Row = Appointment & { service?: { name: string } };

export default function CustomersAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("appointments")
          .select("*, service:services(name)")
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

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; email: string | null; count: number }
    >();
    for (const a of rows) {
      const key = `${a.customer_phone}|${a.customer_email || ""}`;
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else
        map.set(key, {
          name: a.customer_name,
          phone: a.customer_phone,
          email: a.customer_email,
          count: 1,
        });
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [rows]);

  const history = selected
    ? rows.filter(
        (a) => `${a.customer_phone}|${a.customer_email || ""}` === selected
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Customers</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-2">
          {customers.length === 0 ? (
            <EmptyState title="No customers yet" />
          ) : (
            customers.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.key)}
                className={`w-full border px-4 py-3 text-left transition ${
                  selected === c.key
                    ? "border-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.phone}
                  {c.email ? ` · ${c.email}` : ""} · {c.count} visits
                </p>
              </button>
            ))
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl">History</h2>
          {!selected ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Select a customer
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.map((a) => (
                <div key={a.id} className="border border-border px-3 py-2 text-sm">
                  {format(new Date(a.start_datetime), "d MMM yyyy · HH:mm")} ·{" "}
                  {a.service?.name} · {a.status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

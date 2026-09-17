"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function NewAppointmentListener() {
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("admin-appointments")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "appointments" },
          (payload) => {
            const row = payload.new as { customer_name?: string; start_datetime?: string };
            toast({
              title: "New appointment",
              description: `${row.customer_name || "Customer"} · ${
                row.start_datetime
                  ? new Date(row.start_datetime).toLocaleString()
                  : ""
              }`,
            });
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return;
    }
  }, []);

  return null;
}

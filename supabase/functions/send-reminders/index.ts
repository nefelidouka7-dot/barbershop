// Deno Edge Function: supabase functions deploy send-reminders
// Alternative to Next.js /api/cron/reminders

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const start = new Date(now.getTime() + 23 * 3600_000).toISOString();
  const end = new Date(now.getTime() + 25 * 3600_000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select("id, customer_email, customer_name, start_datetime, reminder_sent")
    .eq("reminder_sent", false)
    .in("status", ["pending", "confirmed"])
    .gte("start_datetime", start)
    .lte("start_datetime", end);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ due: data?.length ?? 0, appointments: data });
});

// Supabase Edge Function: harakapay-webhook
// Deploy:
//   supabase functions deploy harakapay-webhook --no-verify-jwt
// Then set HARAKAPAY_WEBHOOK as:
//   https://<project-ref>.supabase.co/functions/v1/harakapay-webhook
//
// HarakaPay POSTs { order_id, status, amount, net_amount, fee_amount, created_at, completed_at }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: cors });
  }

  let body: {
    order_id?: string;
    status?: string;
    amount?: number;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400, headers: cors });
  }

  if (!body.order_id || !body.status) {
    return new Response("ok", { status: 200, headers: cors });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key);

  const mapped =
    body.status === "completed" ? "paid" : body.status === "failed" ? "failed" : body.status;

  await supabase
    .from("salon_payments")
    .update({
      status: mapped,
      completed_at: new Date().toISOString(),
    })
    .eq("order_id", body.order_id);

  if (body.status === "completed") {
    const { data: pays } = await supabase
      .from("salon_payments")
      .select("booking_id, amount, kind")
      .eq("order_id", body.order_id)
      .limit(1);

    const pay = pays?.[0];
    if (pay?.booking_id) {
      const patch: Record<string, unknown> = { payment_order_id: body.order_id };
      if (pay.kind === "deposit" || pay.kind === "full") {
        patch.status = "confirmed";
      }
      if (pay.kind === "balance" || pay.kind === "full") {
        patch.remaining = 0;
      }
      await supabase.from("salon_appointments").update(patch).eq("id", pay.booking_id);
      await supabase
        .from("salon_appointments")
        .update({ status: "confirmed", payment_order_id: body.order_id })
        .eq("status", "payment_pending")
        .eq("payment_order_id", body.order_id);
    }
  }

  if (body.status === "failed") {
    await supabase
      .from("salon_appointments")
      .update({ status: "expired" })
      .eq("status", "payment_pending")
      .eq("payment_order_id", body.order_id);
  }

  return new Response("ok", { status: 200, headers: cors });
});

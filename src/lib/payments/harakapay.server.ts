/**
 * HarakaPay server integration — matches https://harakapay.net docs:
 * - Auth header: X-API-Key
 * - POST /api/v1/collect { phone, amount, description?, webhook_url? }
 * - GET  /api/v1/status/{order_id}
 * - GET  /api/v1/balance
 * - Webhook POST body: { order_id, status: completed|failed, amount, ... }
 */
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";

const BASE = "https://harakapay.net";

/** Public production origin for webhooks (always absolute HTTPS). */
function defaultWebhookUrl(): string | undefined {
  const explicit =
    env("PAYMENT_WEBHOOK_URL") ||
    env("BETTER_AUTH_URL") ||
    (env("VERCEL_URL") ? `https://${env("VERCEL_URL").replace(/^https?:\/\//, "")}` : undefined);
  if (explicit) {
    const origin = explicit.replace(/\/+$/, "");
    return `${origin}/api/payments/webhook`;
  }
  return "https://wsalon-gadnaherys-projects.vercel.app/api/payments/webhook";
}

function apiKey() {
  const key = env("HARAKAPAY_API_KEY");
  if (!key) throw new Error("HARAKAPAY_API_KEY is not set on the server");
  return key;
}

/** Normalize to local TZ format 07XXXXXXXX as HarakaPay examples use. */
export function localPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(0, 10);
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

async function hpFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey(),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

export type CollectResult =
  | { ok: true; orderId: string; amount: number; message: string; netAmount?: number; fee?: number }
  | { ok: false; message: string };

export async function collectHarakapay(input: {
  phone: string;
  amount: number;
  description: string;
  webhookUrl?: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  method: string;
  kind?: "deposit" | "balance" | "full";
}): Promise<CollectResult> {
  const phone = localPhone(input.phone);
  const amount = Math.round(Number(input.amount));
  if (!phone || phone.length < 10) {
    return { ok: false, message: "Enter a valid Tanzanian phone (e.g. 07XXXXXXXX)." };
  }
  if (!Number.isFinite(amount) || amount < 100) {
    return { ok: false, message: "Amount must be at least TSh 100." };
  }

  const webhook_url = input.webhookUrl || defaultWebhookUrl();
  const body: Record<string, unknown> = {
    phone,
    amount,
    description: input.description || `Payment ${input.bookingId}`,
  };
  if (webhook_url) body.webhook_url = webhook_url;

  const { ok, status, json } = await hpFetch("/api/v1/collect", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = json as {
    success?: boolean;
    order_id?: string;
    message?: string;
    error?: string;
    amount?: number;
    net_amount?: number;
    fee?: number;
  } | null;

  if (!ok || !data?.success || !data.order_id) {
    return {
      ok: false,
      message:
        data?.error ||
        data?.message ||
        (status === 401 || status === 403
          ? "HarakaPay rejected the API key. Check HARAKAPAY_API_KEY on Vercel."
          : `HarakaPay could not send the USSD prompt (${status}).`),
    };
  }

  const kind = input.kind ?? "deposit";
  try {
    const sql = await getSql();
    const id = `pay-${data.order_id}`;
    await sql.query(
      `insert into salon_payments (id, booking_id, customer_id, customer_name, amount, method, status, order_id, phone, description, kind)
       values ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)
       on conflict (id) do nothing`,
      [
        id,
        input.bookingId,
        input.customerId,
        input.customerName,
        amount,
        input.method,
        data.order_id,
        phone,
        input.description,
        kind,
      ],
    );
    await sql.query(`update salon_appointments set payment_order_id = $1 where id = $2`, [
      data.order_id,
      input.bookingId,
    ]);
  } catch {
    // Payment still lives at HarakaPay; client store will track order_id.
  }

  return {
    ok: true,
    orderId: data.order_id,
    amount: data.amount ?? amount,
    netAmount: data.net_amount,
    fee: data.fee,
    message: data.message ?? "USSD push sent to phone",
  };
}

export async function harakapayStatus(orderId: string) {
  const { ok, json } = await hpFetch(`/api/v1/status/${encodeURIComponent(orderId)}`);
  const data = json as {
    success?: boolean;
    payment?: {
      order_id: string;
      status: string;
      amount: number;
      net_amount?: number;
      fee_amount?: number;
      completed_at?: string;
    };
    error?: string;
    message?: string;
  } | null;

  const status = data?.payment?.status ?? "unknown";

  // Persist completed/failed when polled (docs: status endpoint can also trigger webhook)
  if (data?.payment && (status === "completed" || status === "failed")) {
    await applyWebhook({
      order_id: orderId,
      status,
      amount: data.payment.amount,
    });
  }

  return {
    ok: ok && !!data?.success,
    status,
    amount: data?.payment?.amount,
    netAmount: data?.payment?.net_amount,
    fee: data?.payment?.fee_amount,
    message: data?.error || data?.message,
  };
}

export async function harakapayBalance() {
  const { ok, json } = await hpFetch("/api/v1/balance");
  const data = json as {
    success?: boolean;
    wallet_balance?: number;
    float_balance?: number;
    error?: string;
  } | null;
  return {
    ok: ok && !!data?.success,
    wallet: data?.wallet_balance ?? 0,
    float: data?.float_balance ?? 0,
    message: data?.error,
  };
}

export async function applyWebhook(payload: {
  order_id?: string;
  status?: string;
  amount?: number;
}) {
  if (!payload.order_id || !payload.status) return { ok: false };
  try {
    const sql = await getSql();
    const mapped =
      payload.status === "completed" ? "paid" : payload.status === "failed" ? "failed" : payload.status;
    await sql.query(
      `update salon_payments set status = $1, completed_at = coalesce(completed_at, now())
       where order_id = $2`,
      [mapped, payload.order_id],
    );
    if (payload.status === "completed") {
      await sql.query(
        `update salon_appointments
         set status = case when status = 'payment_pending' then 'confirmed' else status end,
             payment_order_id = $1,
             remaining = case
               when remaining > 0 and remaining <= $2 then 0
               when remaining > $2 then remaining - $2
               else remaining
             end
         where payment_order_id = $1
            or id in (select booking_id from salon_payments where order_id = $1)`,
        [payload.order_id, payload.amount ?? 0],
      );
    }
    if (payload.status === "failed") {
      await sql.query(
        `update salon_appointments set status = 'expired'
         where status = 'payment_pending'
           and (payment_order_id = $1 or id in (select booking_id from salon_payments where order_id = $1))`,
        [payload.order_id],
      );
    }
  } catch {
    /* DB optional */
  }
  return { ok: true };
}

import { collectPaymentFn, checkPaymentFn } from "./actions";
import { wait } from "@/lib/utils";
import { toLocalTzPhone } from "@/lib/salon/format";
import type { PaymentMethod } from "@/lib/salon/types";

export type CollectInput = {
  phone: string;
  amount: number;
  description: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  method: PaymentMethod | string;
  kind?: "deposit" | "balance" | "full";
  polls?: number;
  intervalMs?: number;
  onPromptSent?: (orderId: string) => void;
  /** Existing pending order — poll only, do NOT send another USSD */
  existingOrderId?: string;
  /** AbortSignal to stop polling when user cancels */
  signal?: AbortSignal;
};

export type CollectOutcome =
  | { ok: true; orderId: string }
  | { ok: false; orderId?: string; pending?: boolean; message: string; cancelled?: boolean };

function aborted(signal?: AbortSignal) {
  return !!signal?.aborted;
}

export async function collectUntilPaid(input: CollectInput): Promise<CollectOutcome> {
  const polls = input.polls ?? 20;
  const intervalMs = input.intervalMs ?? 3000;
  const phone = toLocalTzPhone(input.phone);

  // Reuse open order — never fire a second USSD for the same booking session
  if (input.existingOrderId) {
    input.onPromptSent?.(input.existingOrderId);
    return pollExistingOrder(input.existingOrderId, polls, intervalMs, input.signal);
  }

  if (aborted(input.signal)) {
    return { ok: false, cancelled: true, message: "Payment cancelled." };
  }

  let result: Awaited<ReturnType<typeof collectPaymentFn>>;
  try {
    result = await collectPaymentFn({
      data: {
        phone,
        amount: Math.max(100, Math.round(input.amount)),
        description: input.description,
        bookingId: input.bookingId,
        customerId: input.customerId,
        customerName: input.customerName,
        method: String(input.method),
        kind: input.kind,
      },
    });
  } catch (e) {
    if (aborted(input.signal)) {
      return { ok: false, cancelled: true, message: "Payment cancelled." };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message:
        msg.includes("HARAKAPAY") || msg.includes("API")
          ? msg
          : `Payment request failed: ${msg || "server error"}.`,
    };
  }

  if (aborted(input.signal)) {
    return {
      ok: false,
      orderId: result.ok ? result.orderId : undefined,
      cancelled: true,
      pending: result.ok,
      message: result.ok
        ? "Cancelled. Do not approve any USSD on the phone — a request may already have been sent."
        : "Payment cancelled.",
    };
  }

  if (!result.ok) {
    return { ok: false, message: result.message || "Could not send USSD push." };
  }

  input.onPromptSent?.(result.orderId);
  return pollExistingOrder(result.orderId, polls, intervalMs, input.signal);
}

export async function pollExistingOrder(
  orderId: string,
  polls = 10,
  intervalMs = 2500,
  signal?: AbortSignal,
): Promise<CollectOutcome> {
  try {
    for (let i = 0; i < polls; i++) {
      if (aborted(signal)) {
        return {
          ok: false,
          orderId,
          cancelled: true,
          pending: true,
          message:
            "Cancelled. If a USSD prompt is on your phone, decline it so you are not charged.",
        };
      }
      const st = await checkPaymentFn({ data: { orderId } });
      if (st.status === "completed" || st.status === "paid") return { ok: true, orderId };
      if (st.status === "failed") {
        return { ok: false, orderId, message: "Payment was declined on the phone." };
      }
      await wait(intervalMs);
    }
    return {
      ok: false,
      orderId,
      pending: true,
      message:
        "No confirmation yet. If you already approved USSD, tap Check payment — we will not send another request.",
    };
  } catch (e) {
    if (aborted(signal)) {
      return { ok: false, orderId, cancelled: true, pending: true, message: "Payment cancelled." };
    }
    return {
      ok: false,
      orderId,
      message: e instanceof Error ? e.message : "Could not check that payment.",
    };
  }
}

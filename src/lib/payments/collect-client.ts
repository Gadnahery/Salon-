import { collectPaymentFn, checkPaymentFn } from "./actions";
import { wait } from "@/lib/utils";
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
};

export type CollectOutcome =
  | { ok: true; orderId: string }
  | { ok: false; orderId?: string; pending?: boolean; message: string };

export async function collectUntilPaid(input: CollectInput): Promise<CollectOutcome> {
  const polls = input.polls ?? 24;
  const intervalMs = input.intervalMs ?? 3000;
  try {
    const result = await collectPaymentFn({
      data: {
        phone: input.phone,
        amount: Math.max(100, Math.round(input.amount)),
        description: input.description,
        bookingId: input.bookingId,
        customerId: input.customerId,
        customerName: input.customerName,
        method: String(input.method),
        kind: input.kind,
      },
    });
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    for (let i = 0; i < polls; i++) {
      await wait(intervalMs);
      const st = await checkPaymentFn({ data: { orderId: result.orderId } });
      if (st.status === "completed" || st.status === "paid") return { ok: true, orderId: result.orderId };
      if (st.status === "failed") {
        return { ok: false, orderId: result.orderId, message: "The payment was declined on the phone." };
      }
    }
    return {
      ok: false,
      orderId: result.orderId,
      pending: true,
      message:
        "The USSD prompt is still waiting. Approve it on your phone, then tap Try again — we will not charge twice if it already went through.",
    };
  } catch {
    return { ok: false, message: "The payment service is unavailable right now." };
  }
}

export async function pollExistingOrder(orderId: string, polls = 8, intervalMs = 2500): Promise<CollectOutcome> {
  try {
    for (let i = 0; i < polls; i++) {
      const st = await checkPaymentFn({ data: { orderId } });
      if (st.status === "completed" || st.status === "paid") return { ok: true, orderId };
      if (st.status === "failed") {
        return { ok: false, orderId, message: "The payment was declined on the phone." };
      }
      await wait(intervalMs);
    }
    return { ok: false, orderId, pending: true, message: "Still waiting for the USSD confirmation." };
  } catch {
    return { ok: false, orderId, message: "Could not check that payment." };
  }
}
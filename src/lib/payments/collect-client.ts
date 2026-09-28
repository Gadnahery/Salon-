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
  /** Called when USSD was sent and we start polling */
  onPromptSent?: (orderId: string) => void;
};

export type CollectOutcome =
  | { ok: true; orderId: string }
  | { ok: false; orderId?: string; pending?: boolean; message: string };

export async function collectUntilPaid(input: CollectInput): Promise<CollectOutcome> {
  const polls = input.polls ?? 20;
  const intervalMs = input.intervalMs ?? 3000;

  let result: Awaited<ReturnType<typeof collectPaymentFn>>;
  try {
    result = await collectPaymentFn({
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message:
        msg.includes("HARAKAPAY") || msg.includes("API")
          ? msg
          : `Payment request failed: ${msg || "server error"}. Check your connection and try again.`,
    };
  }

  if (!result.ok) {
    return { ok: false, message: result.message || "Could not send USSD push." };
  }

  input.onPromptSent?.(result.orderId);

  for (let i = 0; i < polls; i++) {
    await wait(intervalMs);
    try {
      const st = await checkPaymentFn({ data: { orderId: result.orderId } });
      if (st.status === "completed" || st.status === "paid") {
        return { ok: true, orderId: result.orderId };
      }
      if (st.status === "failed") {
        return {
          ok: false,
          orderId: result.orderId,
          message: "Payment was declined or failed on the phone. You can try again.",
        };
      }
    } catch {
      // keep polling; status may recover
    }
  }

  return {
    ok: false,
    orderId: result.orderId,
    pending: true,
    message:
      "No confirmation yet. If you approved USSD, tap “Check again”. If you never got a prompt, try again or use another number.",
  };
}

export async function pollExistingOrder(orderId: string, polls = 10, intervalMs = 2500): Promise<CollectOutcome> {
  try {
    for (let i = 0; i < polls; i++) {
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
      message: "Still waiting for confirmation. Approve USSD if it appeared, then check again.",
    };
  } catch (e) {
    return {
      ok: false,
      orderId,
      message: e instanceof Error ? e.message : "Could not check that payment.",
    };
  }
}

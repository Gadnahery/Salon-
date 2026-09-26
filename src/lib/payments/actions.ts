import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const collectSchema = z.object({
  phone: z.string().min(9),
  amount: z.number().positive(),
  description: z.string(),
  bookingId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  method: z.string(),
  kind: z.enum(["deposit", "balance", "full"]).optional(),
});

export const collectPaymentFn = createServerFn({ method: "POST" })
  .validator(collectSchema)
  .handler(async ({ data }) => {
    const { collectHarakapay } = await import("./harakapay.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");
    let webhookUrl: string | undefined;
    try {
      const url = getRequestUrl();
      webhookUrl = `${url.origin}/api/payments/webhook`;
    } catch {
      webhookUrl = undefined;
    }
    return collectHarakapay({ ...data, webhookUrl });
  });

export const checkPaymentFn = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().min(3) }))
  .handler(async ({ data }) => {
    const { harakapayStatus } = await import("./harakapay.server");
    return harakapayStatus(data.orderId);
  });

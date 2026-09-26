import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { applyWebhook } = await import("@/lib/payments/harakapay.server");
        let body: { order_id?: string; status?: string; amount?: number } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        await applyWebhook(body);
        return new Response("ok", { status: 200 });
      },
    },
  },
});

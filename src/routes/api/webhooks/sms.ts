import { createFileRoute } from "@tanstack/react-router";

/** SMS delivery webhook stub. */
export const Route = createFileRoute("/api/webhooks/sms")({
  server: {
    handlers: {
      POST: async () => {
        if (!process.env.SMS_API_KEY) {
          return Response.json({ error: "not configured" }, { status: 501 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});

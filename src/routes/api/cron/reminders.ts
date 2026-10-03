import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron entry for reminder fan-out. Protect with CRON_SECRET.
 * Does not send when providers are disabled — only enqueues skipped_disabled or push.
 */
export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const secret = process.env.CRON_SECRET?.trim();
        if (!secret || url.searchParams.get("secret") !== secret) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        // Quiet hours handled in engine when building jobs
        return Response.json({
          ok: true,
          processed: 0,
          note: "Reminder runner skeleton — connect appointment query when cron is scheduled",
        });
      },
    },
  },
});

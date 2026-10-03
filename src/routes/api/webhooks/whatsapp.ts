import { createFileRoute } from "@tanstack/react-router";

/**
 * WhatsApp Cloud API webhook.
 * GET: verification handshake with WHATSAPP_VERIFY_TOKEN.
 * POST: signature check stub; when not configured returns 501.
 */
export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
        if (!expected) {
          return Response.json({ error: "not configured" }, { status: 501 });
        }
        if (mode === "subscribe" && token === expected && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return Response.json({ error: "forbidden" }, { status: 403 });
      },
      POST: async ({ request }) => {
        const secret = process.env.WHATSAPP_APP_SECRET?.trim();
        if (!secret || !process.env.WHATSAPP_ACCESS_TOKEN) {
          return Response.json({ error: "not configured" }, { status: 501 });
        }
        // TODO(keys): verify X-Hub-Signature-256 with APP_SECRET, update outbox status
        const raw = await request.text();
        void raw;
        return Response.json({ ok: true });
      },
    },
  },
});

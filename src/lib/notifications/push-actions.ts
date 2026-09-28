import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import webpush from "web-push";
import { supabaseSelect, supabaseUpsert } from "@/lib/salon/supabase";
import { VAPID_PUBLIC_KEY, VAPID_SUBJECT, getVapidPrivateKey } from "./vapid";

const subSchema = z.object({
  endpoint: z.string().min(8),
  keysP256dh: z.string().min(8),
  keysAuth: z.string().min(4),
  portal: z.enum(["staff", "admin", "customer"]),
  actorId: z.string().optional(),
});

const notifySchema = z.object({
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),
  tag: z.string().optional(),
  audience: z.enum(["staff", "admin", "customer", "both"]).default("both"),
  /** When set, only push devices for this customer/staff actor */
  actorId: z.string().optional(),
});

function configureWebPush() {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, getVapidPrivateKey());
}

export const savePushSubscriptionFn = createServerFn({ method: "POST" })
  .validator(subSchema)
  .handler(async ({ data }) => {
    await supabaseUpsert(
      "salon_push_subscriptions",
      {
        endpoint: data.endpoint,
        keys_p256dh: data.keysP256dh,
        keys_auth: data.keysAuth,
        portal: data.portal,
        actor_id: data.actorId ?? null,
        updated_at: new Date().toISOString(),
      },
      "endpoint",
    );
    return { ok: true as const };
  });

type SubRow = {
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  portal: string;
};

export const sendStaffPushFn = createServerFn({ method: "POST" })
  .validator(notifySchema)
  .handler(async ({ data }) => {
    configureWebPush();
    const rows = await supabaseSelect<SubRow>(
      "salon_push_subscriptions",
      "select=endpoint,keys_p256dh,keys_auth,portal,actor_id",
    );

    type SubRowFull = SubRow & { actor_id?: string | null };
    const fullRows = rows as SubRowFull[];
    const targets = fullRows.filter((r) => {
      if (data.audience === "both") {
        if (!(r.portal === "staff" || r.portal === "admin")) return false;
      } else if (r.portal !== data.audience) {
        return false;
      }
      if (data.actorId && r.actor_id && r.actor_id !== data.actorId) return false;
      return true;
    });

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url || "/staff",
      tag: data.tag || `booking-${Date.now()}`,
    });

    let sent = 0;
    for (const row of targets) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.keys_p256dh, auth: row.keys_auth },
          },
          payload,
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        // Gone / invalid subscription — drop it
        if (status === 404 || status === 410) {
          try {
            const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import("@/lib/salon/supabase");
            await fetch(
              `${SUPABASE_URL}/rest/v1/salon_push_subscriptions?endpoint=eq.${encodeURIComponent(row.endpoint)}`,
              {
                method: "DELETE",
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
              },
            );
          } catch {
            /* ignore */
          }
        }
      }
    }

    return { ok: true as const, sent, total: targets.length };
  });

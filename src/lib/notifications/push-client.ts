import { VAPID_PUBLIC_KEY } from "./vapid";
import { requestNotifyPermission, getNotifyPermission } from "./web-push";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerBookingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export type PushPortal = "staff" | "admin";

/**
 * Subscribe this device to Web Push for staff/admin.
 * Saves subscription on the server so we can notify when the app is closed.
 */
export async function subscribeStaffPush(opts: {
  portal: PushPortal;
  actorId?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" };
  if (!("PushManager" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }

  const perm = await requestNotifyPermission();
  if (perm !== "granted") return { ok: false, reason: "permission-denied" };

  const reg = await registerBookingServiceWorker();
  if (!reg) return { ok: false, reason: "sw-failed" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "subscribe-failed" };
    }
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "bad-subscription" };
  }

  try {
    const { savePushSubscriptionFn } = await import("./push-actions");
    await savePushSubscriptionFn({
      data: {
        endpoint: json.endpoint,
        keysP256dh: json.keys.p256dh,
        keysAuth: json.keys.auth,
        portal: opts.portal,
        actorId: opts.actorId,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "save-failed" };
  }
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    getNotifyPermission() !== "unsupported"
  );
}

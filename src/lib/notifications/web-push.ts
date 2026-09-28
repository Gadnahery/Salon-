/** Browser / PWA notification helpers for the salon app. */

export type NotifyPermission = NotificationPermission | "unsupported";

export function notificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotifyPermission(): NotifyPermission {
  if (!notificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (!notificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export function showBrowserNotification(
  title: string,
  options?: { body?: string; tag?: string; data?: Record<string, string> },
): boolean {
  if (!notificationSupported() || Notification.permission !== "granted") return false;
  try {
    const n = new Notification(title, {
      body: options?.body,
      tag: options?.tag ?? `salon-${Date.now()}`,
      icon: "/icons/booking-192.png",
      badge: "/icons/booking-192.png",
      data: options?.data,
    });
    n.onclick = () => {
      window.focus();
      n.close();
      const path = options?.data?.url;
      if (path) window.location.assign(path);
    };
    return true;
  } catch {
    return false;
  }
}

const PROMPT_KEY = "salon-notify-prompted";

export function hasPromptedNotify(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(PROMPT_KEY) === "1";
}

export function markPromptedNotify(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROMPT_KEY, "1");
}


/** Fire a browser notification when permission is granted. Safe no-op otherwise. */
export function notifyEvent(
  title: string,
  body: string,
  url?: string,
  tag?: string,
): void {
  showBrowserNotification(title, {
    body,
    tag: tag ?? `booking-${Date.now()}`,
    data: url ? { url } : undefined,
  });
}

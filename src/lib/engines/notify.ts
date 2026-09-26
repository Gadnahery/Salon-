import type { Notice, NoticeAudience } from "@/lib/salon/types";
import { showBrowserNotification } from "@/lib/notifications/web-push";

export function makeNotice(
  title: string,
  body: string,
  audience: NoticeAudience,
  appointmentId?: string,
): Notice {
  const notice: Notice = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    time: new Date().toISOString(),
    read: false,
    appointmentId,
    audience,
  };

  // Fire a real browser / PWA notification when permission is granted.
  // Only for customer-facing notices in the browser session.
  if (typeof window !== "undefined" && audience === "customer") {
    const url = appointmentId ? `/app/appointments/${appointmentId}` : "/app/notifications";
    showBrowserNotification(title, { body, tag: notice.id, data: { url } });
  }

  return notice;
}

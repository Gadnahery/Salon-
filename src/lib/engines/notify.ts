import type { Notice, NoticeAudience } from "@/lib/salon/types";

export function makeNotice(
  title: string,
  body: string,
  audience: NoticeAudience,
  appointmentId?: string,
): Notice {
  return {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    time: new Date().toISOString(),
    read: false,
    appointmentId,
    audience,
  };
}

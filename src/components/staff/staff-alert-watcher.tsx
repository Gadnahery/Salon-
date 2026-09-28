import { useEffect, useRef } from "react";
import { showBrowserNotification, getNotifyPermission } from "@/lib/notifications/web-push";
import { subscribePush, registerBookingServiceWorker } from "@/lib/notifications/push-client";
import { useSalonStore } from "@/lib/salon/store";

const SEEN_KEY = "booking-staff-seen-requests";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-80)));
  } catch {
    /* ignore */
  }
}

/**
 * While staff/admin have the app (or installed PWA) open in background,
 * poll for new booking requests and fire system notifications like native apps.
 * Requires Notification permission = granted.
 */
export function StaffAlertWatcher() {
  const seenRef = useRef<Set<string>>(loadSeen());
  const session = useSalonStore((s) => s.session);

  useEffect(() => {
    if (session.portal !== "staff" && session.portal !== "admin") return;

    void registerBookingServiceWorker();
    void subscribePush({
      portal: session.portal === "admin" ? "admin" : "staff",
      actorId: session.actorId,
    });

    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      if (getNotifyPermission() !== "granted") return;

      try {
        const { pullSalonStateFn } = await import("@/lib/salon/sync-actions");
        const remote = await pullSalonStateFn();
        if (cancelled || !remote) return;

        const local = useSalonStore.getState();
        // Merge remote requested appointments into local if missing
        const remoteRequested = (remote.appointments ?? []).filter(
          (a: { status?: string; id: string }) => a.status === "requested",
        );

        if (remoteRequested.length) {
          const byId = new Map(local.appointments.map((a) => [a.id, a]));
          let changed = false;
          for (const a of remoteRequested) {
            if (!byId.has(a.id)) {
              byId.set(a.id, a as (typeof local.appointments)[0]);
              changed = true;
            }
          }
          if (changed) {
            useSalonStore.setState({
              appointments: [...byId.values()].sort((a, b) =>
                (b.createdAt || "").localeCompare(a.createdAt || ""),
              ),
            });
          }
        }

        const requests = [
          ...remoteRequested,
          ...local.appointments.filter((a) => a.status === "requested"),
        ];
        const unique = new Map(requests.map((a) => [a.id, a]));

        for (const a of unique.values()) {
          if (seenRef.current.has(a.id)) continue;
          seenRef.current.add(a.id);
          saveSeen(seenRef.current);
          showBrowserNotification("New booking request", {
            body: `${a.customerName} · ${a.date} at ${a.time}. Tap to accept.`,
            tag: `req-${a.id}`,
            data: { url: `/staff/appointments/${a.id}` },
          });
        }

        // Staff notices from server
        for (const n of remote.notices ?? []) {
          if (n.audience !== "staff" && n.audience !== "admin") continue;
          const key = `n-${n.id}`;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          saveSeen(seenRef.current);
          showBrowserNotification(n.title, {
            body: n.body,
            tag: key,
            data: n.appointmentId ? { url: `/staff/appointments/${n.appointmentId}` } : { url: "/staff" },
          });
        }
      } catch {
        /* offline / schema */
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), 12_000);
    // Also when tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [session.portal]);

  return null;
}

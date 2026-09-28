import { useEffect, useRef } from "react";
import { useSalonStore } from "@/lib/salon/store";
import { notifyEvent } from "@/lib/notifications/web-push";

function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const SEEN = "booking-reminders-sent";

/** Day-before appointment reminders (feature 10). */
export function ReminderWatcher() {
  const appointments = useSalonStore((s) => s.appointments);
  const session = useSalonStore((s) => s.session);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (typeof window === "undefined") return;
    ran.current = true;

    let seen = new Set<string>();
    try {
      seen = new Set(JSON.parse(localStorage.getItem(SEEN) || "[]") as string[]);
    } catch {
      /* ignore */
    }

    const tm = tomorrowKey();
    const due = appointments.filter(
      (a) =>
        a.date === tm &&
        (a.status === "confirmed" || a.status === "payment_pending") &&
        !seen.has(`rem-${a.id}`),
    );
    if (!due.length) return;

    const notices = [...useSalonStore.getState().notices];
    for (const a of due) {
      seen.add(`rem-${a.id}`);
      const title = "Appointment reminder";
      const body = `Tomorrow at ${a.time}`;
      notices.unshift({
        id: `n-rem-${a.id}`,
        title,
        body: `${body} · ${a.customerName}`,
        time: new Date().toISOString(),
        read: false,
        appointmentId: a.id,
        audience: "customer",
      });
      notices.unshift({
        id: `n-rem-s-${a.id}`,
        title: "Tomorrow's booking",
        body: `${a.customerName} at ${a.time}`,
        time: new Date().toISOString(),
        read: false,
        appointmentId: a.id,
        audience: "staff",
      });
      if (session.portal === "customer" && a.customerId === session.actorId) {
        notifyEvent(title, body, `/app/appointments/${a.id}`, `rem-${a.id}`);
      }
      if (session.portal === "staff" || session.portal === "admin") {
        notifyEvent(
          "Tomorrow's booking",
          `${a.customerName} at ${a.time}`,
          `/staff/appointments/${a.id}`,
          `rem-s-${a.id}`,
        );
      }
    }
    useSalonStore.setState({ notices });
    try {
      localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-100)));
    } catch {
      /* ignore */
    }
  }, [appointments, session]);

  return null;
}

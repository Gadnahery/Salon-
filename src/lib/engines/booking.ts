import { canTransition } from "./rules";
import type { Appointment, AppointmentStatus } from "@/lib/salon/types";

export type BookingEvent =
  | "pay_success"
  | "pay_fail"
  | "expire"
  | "check_in"
  | "start"
  | "complete"
  | "cancel"
  | "no_show"
  | "reschedule";

const EVENT_TO_STATUS: Record<BookingEvent, AppointmentStatus> = {
  pay_success: "confirmed",
  pay_fail: "expired",
  expire: "expired",
  check_in: "checked_in",
  start: "in_service",
  complete: "completed",
  cancel: "cancelled",
  no_show: "no_show",
  reschedule: "confirmed",
};

export function applyEvent(appt: Appointment, event: BookingEvent, at = new Date().toISOString()): Appointment | null {
  const next = EVENT_TO_STATUS[event];
  if (event === "reschedule") {
    if (appt.status === "cancelled" || appt.status === "completed" || appt.status === "no_show") return null;
    return { ...appt, status: "confirmed" };
  }
  if (!canTransition(appt.status, next)) return null;
  const patch: Partial<Appointment> = { status: next };
  if (event === "check_in") patch.checkedInAt = at;
  if (event === "start") patch.startedAt = at;
  if (event === "complete") patch.completedAt = at;
  return { ...appt, ...patch };
}

export function applyEventById(
  appointments: Appointment[],
  id: string,
  event: BookingEvent,
): { appointments: Appointment[]; changed: Appointment | null } {
  let changed: Appointment | null = null;
  const next = appointments.map((a) => {
    if (a.id !== id) return a;
    const applied = applyEvent(a, event);
    if (applied) changed = applied;
    return applied ?? a;
  });
  return { appointments: next, changed };
}

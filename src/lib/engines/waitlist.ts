import type { Appointment, WaitlistEntry } from "@/lib/salon/types";

export type WaitlistOffer = {
  entryId: string;
  date: string;
  time: string;
  expiresAt: string;
};

const DEFAULT_HOLD_MINUTES = 15;

/**
 * Pure waitlist matching: first waiting entry that fits freed slot.
 * Does not mutate booking engine.
 */
export function findNextWaitlistMatch(
  entries: WaitlistEntry[],
  freed: { serviceId: string; stylistId: string; date: string; time: string },
): WaitlistEntry | null {
  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const e of waiting) {
    if (e.serviceId !== freed.serviceId) continue;
    const preferredDate = e.preferredDate;
    if (preferredDate && preferredDate !== freed.date) {
      // simple: match exact preferred date when set
      continue;
    }
    if (e.stylistId && e.stylistId !== "any" && e.stylistId !== freed.stylistId) continue;
    return e;
  }
  return null;
}

export function makeOffer(
  entry: WaitlistEntry,
  slot: { date: string; time: string },
  holdMinutes = DEFAULT_HOLD_MINUTES,
): WaitlistOffer {
  const expires = new Date(Date.now() + holdMinutes * 60_000);
  return {
    entryId: entry.id,
    date: slot.date,
    time: slot.time,
    expiresAt: expires.toISOString(),
  };
}

export function isOfferExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

/** After cancel/expire/reschedule — candidate list for backfill UI. */
export function candidatesForFreedAppointment(
  entries: WaitlistEntry[],
  appt: Pick<Appointment, "serviceId" | "stylistId" | "date" | "time">,
): WaitlistEntry[] {
  const match = findNextWaitlistMatch(entries, {
    serviceId: appt.serviceId,
    stylistId: appt.stylistId,
    date: appt.date,
    time: appt.time,
  });
  return match ? [match] : [];
}

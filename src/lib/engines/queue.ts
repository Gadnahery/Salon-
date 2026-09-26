import type { Appointment, QueueEntry, QueueStatus } from "@/lib/salon/types";

export function rebuildQueue(appointments: Appointment[], existing: QueueEntry[]): QueueEntry[] {
  const floor = appointments.filter(
    (a) => a.status === "checked_in" || a.status === "in_service" || a.status === "completed",
  );
  const byAppt = new Map(existing.map((q) => [q.appointmentId, q]));
  const entries: QueueEntry[] = floor.map((a) => {
    const prev = byAppt.get(a.id);
    const status: QueueStatus =
      a.status === "in_service" ? "in_service" : a.status === "completed" ? "completed" : "waiting";
    return {
      id: prev?.id ?? `q-${a.id}`,
      appointmentId: a.id,
      position: prev?.position ?? 0,
      status,
      arrivedAt: a.checkedInAt ?? prev?.arrivedAt ?? a.createdAt,
      startedAt: a.startedAt ?? prev?.startedAt,
      completedAt: a.completedAt ?? prev?.completedAt,
    };
  });
  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => {
      if (a.position && b.position && a.position !== b.position) return a.position - b.position;
      return a.arrivedAt.localeCompare(b.arrivedAt);
    })
    .map((e, i) => ({ ...e, position: i + 1 }));
  const rest = entries.filter((e) => e.status !== "waiting");
  return [...waiting, ...rest];
}

export function waitingMinutes(arrivedAt: string, now = new Date()) {
  return Math.max(0, Math.round((now.getTime() - new Date(arrivedAt).getTime()) / 60000));
}

export function nextWaiting(entries: QueueEntry[], stylistId?: string, appointments?: Appointment[]) {
  const waiting = entries.filter((e) => e.status === "waiting").sort((a, b) => a.position - b.position);
  if (!stylistId || !appointments) return waiting[0] ?? null;
  return (
    waiting.find((e) => {
      const a = appointments.find((x) => x.id === e.appointmentId);
      return a && (a.stylistId === stylistId || a.anyStylist);
    }) ?? null
  );
}

export function moveWaiting(entries: QueueEntry[], appointmentId: string, dir: -1 | 1): QueueEntry[] {
  const waiting = entries.filter((e) => e.status === "waiting").sort((a, b) => a.position - b.position);
  const i = waiting.findIndex((e) => e.appointmentId === appointmentId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= waiting.length) return entries;
  const copy = [...waiting];
  const tmp = copy[i];
  copy[i] = copy[j];
  copy[j] = tmp;
  const reindexed = copy.map((e, idx) => ({ ...e, position: idx + 1 }));
  const rest = entries.filter((e) => e.status !== "waiting");
  return [...reindexed, ...rest];
}

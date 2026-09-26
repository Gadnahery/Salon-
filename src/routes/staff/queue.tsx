import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/salon/confirm-sheet";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist } from "@/lib/salon/data";
import { formatClock } from "@/lib/salon/format";
import { waitingMinutes } from "@/lib/engines/queue";
import { useSalonStore, useStaffAppointments } from "@/lib/salon/store";
import { cn, useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/staff/queue")({ component: StaffQueue });

type Tab = "all" | "waiting" | "in_service" | "completed";

function StaffQueue() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("waiting");
  const queue = useSalonStore((s) => s.queue);
  const appointments = useStaffAppointments();
  const startService = useSalonStore((s) => s.startService);
  const completeService = useSalonStore((s) => s.completeService);
  const lastCompletedId = useSalonStore((s) => s.lastCompletedId);
  const [confirm, setConfirm] = useState<{ id: string; kind: "start" | "complete" } | null>(null);

  const rows = useMemo(() => {
    return queue
      .map((q) => ({ q, a: appointments.find((x) => x.id === q.appointmentId) }))
      .filter((x) => x.a)
      .filter((x) => (tab === "all" ? x.q.status !== "removed" : x.q.status === tab));
  }, [queue, appointments, tab]);

  const waitingCount = queue.filter((q) => q.status === "waiting").length;
  const confirmAppt = confirm ? appointments.find((a) => a.id === confirm.id) : null;
  const nextAfter = queue.find((q) => q.status === "waiting");
  const nextAppt = nextAfter ? appointments.find((a) => a.id === nextAfter.appointmentId) : null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-6">
      <p className="text-micro uppercase tracking-[0.16em] text-muted">Queue</p>
      <h1 className="mt-1 text-title font-normal">Today</h1>
      <p className="mt-1 text-support text-muted">{format(new Date(), "EEEE, d MMMM")}</p>
      <p className="mt-4 text-body">{hydrated ? `${waitingCount} customer${waitingCount === 1 ? "" : "s"} waiting` : "—"}</p>

      <div className="mt-6 flex gap-2 overflow-x-auto hide-scroll">
        {(["all", "waiting", "in_service", "completed"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-support capitalize",
              tab === t ? "bg-ink text-white" : "border border-line",
            )}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {lastCompletedId && nextAppt && tab === "waiting" && (
        <div className="mt-6 rounded-[24px] border border-line bg-brand-soft p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Next customer</p>
          <p className="mt-2 text-section font-normal">{nextAppt.customerName}</p>
          <p className="text-body text-muted">
            {getService(nextAppt.serviceId)?.name}
            {nextAppt.source === "walk_in" ? " · Walk-in" : ""}
          </p>
          <p className="mt-2 text-support text-muted">Waiting {waitingMinutes(nextAfter!.arrivedAt)} min</p>
          <Button className="mt-4 h-12 w-full" onClick={() => setConfirm({ id: nextAppt.id, kind: "start" })}>
            Start service
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {rows.map(({ q, a }, i) => (
          <li key={q.id} className="rounded-[24px] bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-support tabular-nums text-muted">{String(q.position || i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-section font-normal">{a!.customerName}</p>
                <p className="text-body text-muted">{getService(a!.serviceId)?.name}</p>
              </div>
              <StatusPill status={q.status} label={q.status === "waiting" ? "Waiting" : undefined} />
            </div>
            <p className="mt-4 text-support text-muted">
              {a!.source === "walk_in" ? "Walk-in" : "Appointment"}
              {a!.source === "appointment" ? ` · ${formatClock(a!.time)}` : ` · ${formatClock(a!.time)}`}
              {a!.checkedInAt ? ` · Arrived ${format(new Date(a!.checkedInAt), "h:mm a")}` : ""}
            </p>
            {q.status === "waiting" && (
              <p className="mt-1 text-support text-muted">{waitingMinutes(q.arrivedAt)} min waiting</p>
            )}
            {q.status === "in_service" && q.startedAt && (
              <p className="mt-1 text-support text-muted">Started {format(new Date(q.startedAt), "h:mm a")}</p>
            )}
            <p className="mt-2 text-support text-muted">{getStylist(a!.stylistId)?.name ?? "Any available"}</p>
            <div className="mt-4 flex gap-3">
              <Link to="/staff/appointments/$id" params={{ id: a!.id }} className="flex-1">
                <Button variant="secondary" className="h-11 w-full">
                  Details
                </Button>
              </Link>
              {q.status === "waiting" && (
                <Button className="h-11 flex-1" onClick={() => setConfirm({ id: a!.id, kind: "start" })}>
                  Start service
                </Button>
              )}
              {q.status === "in_service" && (
                <Button className="h-11 flex-1" onClick={() => setConfirm({ id: a!.id, kind: "complete" })}>
                  Complete service
                </Button>
              )}
            </div>
          </li>
        ))}
        {hydrated && rows.length === 0 && (
          <p className="pt-10 text-center text-body text-muted">Nothing in this view.</p>
        )}
      </ul>

      <ConfirmSheet
        open={!!confirm}
        title={confirm?.kind === "complete" ? "Complete appointment?" : "Start service?"}
        body={
          confirmAppt ? (
            <p>
              {confirmAppt.customerName}
              <br />
              {getService(confirmAppt.serviceId)?.name}
            </p>
          ) : null
        }
        confirmLabel={confirm?.kind === "complete" ? "Complete" : "Start"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "start") startService(confirm.id);
          else completeService(confirm.id);
          setConfirm(null);
        }}
      />
    </main>
  );
}

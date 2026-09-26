import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist, stylistsOnTeam } from "@/lib/salon/data";
import { waitingMinutes } from "@/lib/engines/queue";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/queue")({ component: AdminQueue });

function AdminQueue() {
  const queue = useSalonStore((s) => s.queue);
  const appointments = useSalonStore((s) => s.appointments);
  const audit = useSalonStore((s) => s.audit);
  const startService = useSalonStore((s) => s.startService);
  const completeService = useSalonStore((s) => s.completeService);
  const assignStylist = useSalonStore((s) => s.assignStylist);
  const markNoShow = useSalonStore((s) => s.markNoShow);
  const reorderQueue = useSalonStore((s) => s.reorderQueue);
  const [tab, setTab] = useState<"waiting" | "in_service" | "completed">("waiting");

  const rows = queue
    .map((q) => ({ q, a: appointments.find((x) => x.id === q.appointmentId) }))
    .filter((x) => x.a && x.q.status === tab);

  const counts = {
    waiting: queue.filter((q) => q.status === "waiting").length,
    in_service: queue.filter((q) => q.status === "in_service").length,
    completed: queue.filter((q) => q.status === "completed").length,
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Queue management</h1>
      <p className="mt-1 text-support text-muted">{format(new Date(), "EEEE d MMMM")}</p>
      <div className="mt-6 flex gap-6 text-body">
        <span>Waiting {counts.waiting}</span>
        <span>In service {counts.in_service}</span>
        <span>Completed {counts.completed}</span>
      </div>
      <div className="mt-4 flex gap-2">
        {(["waiting", "in_service", "completed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-10 rounded-full px-4 text-support capitalize",
              tab === t ? "bg-ink text-white" : "border border-line",
            )}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <ul className="space-y-3 lg:col-span-3">
          {rows.map(({ q, a }) => (
            <li key={q.id} className="rounded-[24px] bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-support tabular-nums text-muted">{String(q.position).padStart(2, "0")}</p>
                  <p className="mt-1 text-body font-medium">{a!.customerName}</p>
                  <p className="text-support text-muted">
                    {getService(a!.serviceId)?.name} · {getStylist(a!.stylistId)?.name ?? "Any available"}
                  </p>
                  {tab === "waiting" && (
                    <p className="mt-2 text-support text-muted">{waitingMinutes(q.arrivedAt)} min waiting</p>
                  )}
                </div>
                <StatusPill status={q.status} />
              </div>
              {tab === "waiting" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {stylistsOnTeam().map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="h-9 rounded-full border border-line px-3 text-support"
                      onClick={() => assignStylist(a!.id, s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {tab === "waiting" && (
                  <>
                    <Button className="h-11" onClick={() => startService(a!.id)}>
                      Start
                    </Button>
                    <Button variant="secondary" className="h-11" onClick={() => reorderQueue(a!.id, -1)}>
                      Up
                    </Button>
                    <Button variant="secondary" className="h-11" onClick={() => reorderQueue(a!.id, 1)}>
                      Down
                    </Button>
                  </>
                )}
                {tab === "in_service" && (
                  <Button className="h-11" onClick={() => completeService(a!.id)}>
                    Complete
                  </Button>
                )}
                {tab !== "completed" && (
                  <Button variant="secondary" className="h-11" onClick={() => markNoShow(a!.id)}>
                    No-show
                  </Button>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && <p className="text-body text-muted">Empty.</p>}
        </ul>
        <section className="rounded-[24px] bg-surface p-5 lg:col-span-2">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Queue activity</p>
          <ul className="mt-4 space-y-4">
            {audit.slice(0, 12).map((e) => (
              <li key={e.id}>
                <p className="text-support text-muted">{format(new Date(e.at), "h:mm a")}</p>
                <p className="text-body">
                  {e.actor} {e.action}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

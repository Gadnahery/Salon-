import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/salon/confirm-sheet";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import { formatClock, formatDuration, greeting } from "@/lib/salon/format";
import { effectiveShift, useSalonStore, useStaffAppointments } from "@/lib/salon/store";
import { waitingMinutes } from "@/lib/engines/queue";
import { todayKey } from "@/lib/engines/schedule";
import type { ShiftStatus } from "@/lib/salon/types";
import { cn, useHydrated } from "@/lib/utils";
import { SwipeAppointmentRow } from "@/components/staff/swipe-appointment-row";

export const Route = createFileRoute("/staff/")({ component: StaffToday });

const STATUSES: { id: ShiftStatus; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "busy", label: "Busy" },
  { id: "on_break", label: "On break" },
  { id: "offline", label: "Offline" },
];

function StaffToday() {
  const hydrated = useHydrated();
  const session = useSalonStore((s) => s.session);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const setStaffStatus = useSalonStore((s) => s.setStaffStatus);
  const queue = useSalonStore((s) => s.queue);
  const startService = useSalonStore((s) => s.startService);
  const markNoShow = useSalonStore((s) => s.markNoShow);
  const completeService = useSalonStore((s) => s.completeService);
  const lastCompletedId = useSalonStore((s) => s.lastCompletedId);
  const appointments = useStaffAppointments();
  const [confirm, setConfirm] = useState<{ id: string; kind: "start" | "complete" } | null>(null);

  const today = todayKey();
  const todays = appointments.filter((a) => a.date === today);
  const counts = {
    all: todays.filter((a) => a.status !== "cancelled" && a.status !== "expired").length,
    completed: todays.filter((a) => a.status === "completed").length,
    waiting: todays.filter((a) => a.status === "checked_in").length,
    inService: todays.filter((a) => a.status === "in_service").length,
  };
  const nowAppt = todays.find((a) => a.status === "in_service");
  const nextAppt = todays
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time))[0];
  const waiting = queue
    .filter((q) => q.status === "waiting")
    .map((q) => ({ q, a: appointments.find((x) => x.id === q.appointmentId) }))
    .filter((x) => x.a)
    .slice(0, 4);
  const timeline = [...todays].sort((a, b) => a.time.localeCompare(b.time));
  const waitlist = useSalonStore((s) => s.waitlist).filter((w) => w.status === "waiting");
  const pendingRequests = appointments
    .filter((a) => a.status === "requested" || (a.needsProviderConfirm && !a.providerConfirmed))
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const shift = effectiveShift(session.actorId, appointments, staffStatus[session.actorId] ?? "available");
  const confirmAppt = confirm ? appointments.find((a) => a.id === confirm.id) : null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-6 lg:max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-micro uppercase tracking-[0.16em] text-muted">{greeting()}</p>
          <h1 className="mt-1 text-title font-normal">{hydrated ? session.name : "—"}</h1>
          <p className="mt-1 text-support text-muted">
            {format(new Date(), "EEEE, d MMMM")}
            <br />
            {SALON.name}
          </p>
        </div>
        <div className="text-right">
          <span className="flex size-11 items-center justify-center rounded-full bg-ink font-display text-sm text-white">
            {session.name[0]}
          </span>
          <div className="mt-2">
            <StatusPill status={shift} label={STATUSES.find((s) => s.id === shift)?.label ?? shift} />
          </div>
        </div>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto hide-scroll">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStaffStatus(session.actorId, s.id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-support",
              staffStatus[session.actorId] === s.id ? "bg-ink text-white" : "border border-line",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {pendingRequests.length > 0 && (
        <section className="mt-6 rounded-[24px] border border-ink bg-surface p-5">
          <p className="text-section font-normal">Accept booking requests</p>
          <p className="mt-1 text-support text-muted">
            Customers are waiting. Accept so they can pay the deposit.
          </p>
          <ul className="mt-4 space-y-2">
            {pendingRequests.map((a) => (
              <li key={a.id}>
                <Link
                  to="/staff/appointments/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3"
                >
                  <span>
                    <span className="block text-body font-medium">{a.customerName}</span>
                    <span className="block text-support text-muted">
                      {a.date} · {a.time}
                    </span>
                  </span>
                  <span className="text-support font-medium">Review</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Today</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Stat n={counts.all} label="Appointments" />
          <Stat n={counts.completed} label="Completed" />
          <Stat n={counts.inService} label="In service" />
          <Stat n={counts.waiting} label="Waiting" />
        </div>
      </section>

      {nowAppt ? (
        <section className="mt-8">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Now</p>
          <div className="mt-3 rounded-[24px] bg-surface p-5">
            <p className="text-section font-normal">{nowAppt.customerName}</p>
            <p className="mt-1 text-body text-muted">{getService(nowAppt.serviceId)?.name}</p>
            <p className="mt-4 text-body">
              {formatClock(nowAppt.time)}
              <span className="text-muted">
                {" "}
                · {formatDuration(getService(nowAppt.serviceId)?.durationMin ?? 60, getService(nowAppt.serviceId)?.durationMax)}
              </span>
            </p>
            <div className="mt-3">
              <StatusPill status="in_service" />
            </div>
            <div className="mt-5 flex gap-3">
              <Link to="/staff/appointments/$id" params={{ id: nowAppt.id }} className="flex-1">
                <Button variant="secondary" className="h-12 w-full">
                  View appointment
                </Button>
              </Link>
              <Button className="h-12 flex-1" onClick={() => setConfirm({ id: nowAppt.id, kind: "complete" })}>
                Complete
              </Button>
            </div>
          </div>
        </section>
      ) : nextAppt ? (
        <section className="mt-8">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Next appointment</p>
          <div className="mt-3 rounded-[24px] bg-surface p-5">
            <p className="text-section font-normal">{formatClock(nextAppt.time)}</p>
            <p className="mt-2 text-body font-medium">{nextAppt.customerName}</p>
            <p className="text-body text-muted">{getService(nextAppt.serviceId)?.name}</p>
            <p className="mt-2 text-support text-muted">
              {getStylist(nextAppt.stylistId)?.name ?? "Any stylist"} ·{" "}
              {formatDuration(getService(nextAppt.serviceId)?.durationMin ?? 60)}
            </p>
            <p className="mt-4 text-support text-muted">
              {formatDistanceToNow(parseISO(`${nextAppt.date}T${nextAppt.time}:00`), { addSuffix: true })}
            </p>
            <Link to="/staff/appointments/$id" params={{ id: nextAppt.id }} className="mt-5 block">
              <Button variant="secondary" className="h-12 w-full">
                View appointment
              </Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-[24px] bg-surface p-5">
          <p className="text-section font-normal">Nothing in the chair</p>
          <p className="mt-2 text-body text-muted">When someone is waiting, start service from the queue.</p>
        </section>
      )}

      {lastCompletedId && waiting[0]?.a && (
        <section className="mt-8">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Next customer</p>
          <div className="mt-3 rounded-[24px] border border-line bg-brand-soft p-5">
            <p className="text-section font-normal">{waiting[0].a.customerName}</p>
            <p className="text-body text-muted">
              {getService(waiting[0].a.serviceId)?.name}
              {waiting[0].a.source === "walk_in" ? " · Walk-in" : ""}
            </p>
            <p className="mt-2 text-support text-muted">Waiting {waitingMinutes(waiting[0].q.arrivedAt)} min</p>
            <Button className="mt-4 h-12 w-full" onClick={() => setConfirm({ id: waiting[0].a!.id, kind: "start" })}>
              Start service
            </Button>
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <p className="text-micro uppercase tracking-[0.16em] text-muted">Waiting now</p>
            <Link to="/staff/queue" className="text-support text-muted">
              Queue
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {waiting.map(({ q, a }, i) => (
              <li key={q.id} className="flex items-center gap-4 rounded-[20px] bg-surface px-4 py-4">
                <span className="w-6 text-support text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{a!.customerName}</p>
                  <p className="text-support text-muted">
                    {getService(a!.serviceId)?.name}
                    {a!.source === "walk_in" ? " · Walk-in" : ""}
                    {" · "}
                    {waitingMinutes(q.arrivedAt)} min waiting
                  </p>
                </div>
                <Button size="sm" onClick={() => setConfirm({ id: a!.id, kind: "start" })}>
                  Start
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {waitlist.length > 0 && (
        <section className="mt-6 rounded-[24px] border border-line bg-surface p-5">
          <p className="text-section font-normal">Waitlist</p>
          <p className="mt-1 text-support text-muted">Customers waiting for an open slot.</p>
          <ul className="mt-4 space-y-2">
            {waitlist.map((w) => (
              <li key={w.id} className="rounded-2xl bg-bg px-4 py-3 text-body">
                <span className="font-medium">{w.customerName}</span>
                <span className="block text-support text-muted">
                  {w.preferredDate} · {w.serviceId}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Today&apos;s appointments</p>
        <p className="mt-1 text-support text-muted">Swipe right to start · left for no-show</p>
        <ol className="mt-4 space-y-0">
          {timeline.map((a) => (
            <SwipeAppointmentRow
              key={a.id}
              appointment={a}
              onStart={
                a.status === "checked_in"
                  ? (id) => setConfirm({ id, kind: "start" })
                  : undefined
              }
              onNoShow={
                a.status === "confirmed" || a.status === "checked_in"
                  ? (id) => {
                      if (window.confirm("Mark as no-show?")) markNoShow(id);
                    }
                  : undefined
              }
            />
          ))}
          {timeline.length === 0 && <p className="text-body text-muted">No appointments on the book today.</p>}
        </ol>
      </section>

      <ConfirmSheet
        open={!!confirm}
        title={confirm?.kind === "complete" ? "Complete appointment?" : "Start service?"}
        body={
          confirmAppt ? (
            <p>
              {confirmAppt.customerName}
              <br />
              {getService(confirmAppt.serviceId)?.name}
              {confirmAppt.time ? (
                <>
                  <br />
                  {formatClock(confirmAppt.time)}
                </>
              ) : null}
            </p>
          ) : (
            "—"
          )
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

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 text-center">
      <p className="font-display text-title tabular-nums leading-none">{n}</p>
      <p className="mt-1 text-micro uppercase tracking-[0.08em] text-muted">{label}</p>
    </div>
  );
}

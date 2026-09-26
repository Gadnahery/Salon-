import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getService, getStylist } from "@/lib/salon/data";
import { displayPhase, formatApptWhen, phaseCopy } from "@/lib/salon/format";
import { useSalonStore, useMyAppointments } from "@/lib/salon/store";
import type { Appointment } from "@/lib/salon/types";
import { cn, useHydrated } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/salon/photo";

export const Route = createFileRoute("/app/appointments/")({ component: AppointmentsPage });

type Tab = "upcoming" | "past";

function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const hydrated = useHydrated();
  const appointments = useMyAppointments();

  const upcoming = appointments.filter((a) =>
    ["payment_pending", "confirmed", "checked_in", "in_service"].includes(a.status),
  );
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled");
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-10 pt-6">
      <h1 className="text-title font-normal">Appointments</h1>
      <div className="mt-6 flex gap-2">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-10 rounded-full px-4 text-support capitalize",
              tab === t ? "bg-ink text-white" : "border border-line bg-transparent text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {!hydrated && [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)}
        {hydrated &&
          list.map((a) => (
            <li key={a.id}>
              <ApptRow appt={a} />
            </li>
          ))}
        {hydrated && list.length === 0 && (
          <div className="pt-16 text-center">
            <p className="text-section font-normal">
              {tab === "upcoming" ? "No upcoming appointments" : "Nothing here yet."}
            </p>
            {tab === "upcoming" && (
              <Link to="/app/book" className="mt-6 inline-block">
                <Button className="h-12">Book an appointment</Button>
              </Link>
            )}
          </div>
        )}
      </ul>
    </main>
  );
}

function ApptRow({ appt }: { appt: Appointment }) {
  const service = getService(appt.serviceId);
  const stylist = appt.anyStylist ? null : getStylist(appt.stylistId);
  if (!service) return null;
  const phase = displayPhase(appt);
  const copy = phaseCopy(phase, appt.time);
  return (
    <Link
      to="/app/appointments/$id"
      params={{ id: appt.id }}
      className="flex gap-4 rounded-[20px] bg-surface p-3"
    >
      <Photo src={service.image} alt="" className="size-20 rounded-2xl" />
      <span className="min-w-0 flex-1 py-1">
        <span className="block text-body font-medium">{service.name}</span>
        <span className="mt-0.5 block text-support text-muted">
          {stylist?.name ?? "Stylist to be confirmed"} · {formatApptWhen(appt.date, appt.time)}
        </span>
        <span
          className={cn(
            "mt-2 inline-block text-support",
            phase === "cancelled" ? "text-danger" : "text-success",
          )}
        >
          {copy.title}
        </span>
      </span>
    </Link>
  );
}

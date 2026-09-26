import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusPill } from "@/components/salon/status-pill";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { ScreenHeader } from "@/components/salon/screen-header";
import { getService } from "@/lib/salon/data";
import { formatClock } from "@/lib/salon/format";
import { effectiveShift, useSalonStore, useStaffAppointments } from "@/lib/salon/store";
import { todayKey } from "@/lib/engines/schedule";

export const Route = createFileRoute("/staff/profile")({ component: StaffProfile });

function StaffProfile() {
  const session = useSalonStore((s) => s.session);
  const team = useSalonStore((s) => s.team);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const appointments = useStaffAppointments();
  const member = team.find((m) => m.id === session.actorId);
  const today = todayKey();
  const mine = appointments.filter((a) => a.date === today);
  const shift = effectiveShift(session.actorId, appointments, staffStatus[session.actorId] ?? "available");

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-28">
      <ScreenHeader title="My profile" backTo="/staff/more" />
      <div className="px-5">
        <div className="flex items-center gap-4 rounded-[24px] bg-surface p-5">
          {member ? <StylistAvatar stylist={member} /> : null}
          <div>
            <p className="text-body font-medium">{session.name}</p>
            <p className="text-support text-muted">{member?.title ?? session.role}</p>
            <div className="mt-1">
              <StatusPill status={shift} />
            </div>
          </div>
        </div>

        {member && (
          <section className="mt-6 rounded-[24px] bg-surface p-5">
            <p className="text-micro uppercase tracking-[0.16em] text-muted">Services</p>
            <p className="mt-3 text-body">
              {member.serviceIds.map((id) => getService(id)?.name).filter(Boolean).join(" · ") || "Assigned on the floor"}
            </p>
            <p className="mt-4 text-support text-muted">{member.phone}</p>
            <p className="text-support text-muted">{member.email}</p>
          </section>
        )}

        <p className="mt-8 text-micro uppercase tracking-[0.16em] text-muted">Today</p>
        <ul className="mt-3 space-y-2">
          {mine
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((a) => (
              <li key={a.id}>
                <Link
                  to="/staff/appointments/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3"
                >
                  <span>
                    <span className="block text-body">{a.customerName}</span>
                    <span className="text-support text-muted">
                      {formatClock(a.time)} · {getService(a.serviceId)?.name}
                    </span>
                  </span>
                  <StatusPill status={a.status} />
                </Link>
              </li>
            ))}
          {mine.length === 0 && <p className="text-body text-muted">No appointments assigned today.</p>}
        </ul>
      </div>
    </main>
  );
}

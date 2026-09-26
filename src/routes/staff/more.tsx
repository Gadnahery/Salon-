import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Calendar, CircleHelp, LogOut, Scissors, User, Users } from "lucide-react";
import { StatusPill } from "@/components/salon/status-pill";
import { team } from "@/lib/salon/data";
import { effectiveShift, useSalonStore } from "@/lib/salon/store";
import { can } from "@/lib/engines/rules";

export const Route = createFileRoute("/staff/more")({ component: StaffMore });

function StaffMore() {
  const session = useSalonStore((s) => s.session);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const appointments = useSalonStore((s) => s.appointments);
  const member = team.find((t) => t.id === session.actorId);
  const shift = effectiveShift(session.actorId, appointments, staffStatus[session.actorId] ?? "available");
  const showCustomers = can(session.role, "manageCustomers");

  return (
    <main className="mx-auto max-w-lg px-5 pb-28 pt-6">
      <h1 className="text-title font-normal">More</h1>
      <div className="mt-6 flex items-center gap-4 rounded-[24px] bg-surface p-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-ink font-display text-lg text-surface">
          {session.name[0]}
        </span>
        <div>
          <p className="text-body font-medium">{session.name}</p>
          <p className="text-support text-muted">{member?.title ?? session.role}</p>
          <div className="mt-1">
            <StatusPill status={shift} />
          </div>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-line rounded-[24px] bg-surface px-5">
        <Row to="/staff/profile" icon={User} label="My profile" />
        <Row to="/staff/calendar" icon={Calendar} label="My schedule" />
        <Row to="/staff/availability" icon={Scissors} label="Availability" />
        {showCustomers && <Row to="/staff/customers" icon={Users} label="Customers" />}
        <Row to="/staff/notifications" icon={Bell} label="Notifications" />
        <Row to="/app/help" icon={CircleHelp} label="Help" />
      </ul>

      <p className="mt-10 text-micro uppercase tracking-[0.16em] text-muted">Salon</p>
      <ul className="mt-3 divide-y divide-line rounded-[24px] bg-surface px-5">
        <li>
          <a href="tel:+255754221088" className="flex h-14 items-center text-body">
            Contact manager
          </a>
        </li>
        <li>
          <Link to="/enter" className="flex h-14 items-center gap-3 text-body">
            <LogOut className="size-4" strokeWidth={1.75} />
            Log out
          </Link>
        </li>
      </ul>
    </main>
  );
}

function Row({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof User;
  label: string;
}) {
  return (
    <li>
      <Link to={to} className="flex h-14 items-center gap-3 text-body">
        <Icon className="size-4 text-muted" strokeWidth={1.75} />
        {label}
      </Link>
    </li>
  );
}

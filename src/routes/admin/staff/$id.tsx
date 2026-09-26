import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getTeamMember } from "@/lib/salon/data";
import { todayKey } from "@/lib/engines/schedule";
import { effectiveShift, useSalonStore } from "@/lib/salon/store";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const Route = createFileRoute("/admin/staff/$id")({ component: AdminStaffProfile });

function AdminStaffProfile() {
  const { id } = Route.useParams();
  const member = getTeamMember(id);
  const appointments = useSalonStore((s) => s.appointments);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const timeOffAll = useSalonStore((s) => s.timeOff);
  const timeOff = timeOffAll.filter((t) => t.staffId === id);
  const addTimeOff = useSalonStore((s) => s.addTimeOff);
  const removeTimeOff = useSalonStore((s) => s.removeTimeOff);
  if (!member) {
    return (
      <main className="px-8 py-16">
        <p>Staff member not found.</p>
      </main>
    );
  }
  const shift = effectiveShift(id, appointments, staffStatus[id] ?? "available");
  const today = appointments.filter((a) => a.date === todayKey() && a.stylistId === id);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <Link to="/admin/staff" className="text-support text-muted">
        Staff
      </Link>
      <h1 className="mt-3 text-title font-normal">{member.name}</h1>
      <p className="text-body text-muted">{member.title}</p>
      <div className="mt-3">
        <StatusPill status={shift} />
      </div>
      <section className="mt-8 rounded-[24px] bg-surface p-5 text-body">
        <p>
          <span className="text-muted">Phone · </span>
          {member.phone}
        </p>
        <p className="mt-2">
          <span className="text-muted">Role · </span>
          {member.role}
        </p>
        <p className="mt-4 text-support text-muted">Services</p>
        <ul className="mt-2 space-y-1">
          {member.serviceIds.map((sid) => (
            <li key={sid}>✓ {getService(sid)?.name ?? sid}</li>
          ))}
          {member.serviceIds.length === 0 && <li>Front of house</li>}
        </ul>
      </section>
      <section className="mt-6 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Weekly schedule</p>
        <ul className="mt-3 space-y-2 text-body">
          {DAYS.map((label, day) => {
            const h = member.hours.find((x) => x.day === day);
            return (
              <li key={day} className="flex justify-between">
                <span>{label}</span>
                <span className="text-muted">{!h || h.off ? "Off" : `${h.start} – ${h.end}`}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-6 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Time off</p>
        <ul className="mt-3 space-y-2">
          {timeOff.map((t) => (
            <li key={t.id} className="flex items-center justify-between text-body">
              <span>
                {t.date} · {t.reason}
              </span>
              <button type="button" className="text-support text-muted" onClick={() => removeTimeOff(t.id)}>
                Remove
              </button>
            </li>
          ))}
          {timeOff.length === 0 && <p className="text-support text-muted">No upcoming leave.</p>}
        </ul>
        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addTimeOff(id, String(fd.get("date")), String(fd.get("reason") || "Personal leave"));
            e.currentTarget.reset();
          }}
        >
          <Input name="date" type="date" required />
          <Input name="reason" placeholder="Reason" />
          <Button type="submit" className="h-13">
            Add
          </Button>
        </form>
      </section>
      <section className="mt-6">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Today</p>
        <ul className="mt-3 space-y-2">
          {today.map((a) => (
            <li key={a.id} className="rounded-2xl bg-surface px-4 py-3 text-body">
              {a.time} · {a.customerName} · {getService(a.serviceId)?.name}
            </li>
          ))}
          {today.length === 0 && <p className="text-body text-muted">No appointments assigned today.</p>}
        </ul>
      </section>
    </main>
  );
}

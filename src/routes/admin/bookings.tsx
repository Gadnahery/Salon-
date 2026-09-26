import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist } from "@/lib/salon/data";
import { formatClock, formatShortDate, formatTsh, statusLabel } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import type { Appointment, AppointmentStatus } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

function AdminBookings() {
  const appointments = useSalonStore((s) => s.appointments);
  const cancelAppointment = useSalonStore((s) => s.cancelAppointment);
  const checkIn = useSalonStore((s) => s.checkIn);
  const startService = useSalonStore((s) => s.startService);
  const completeService = useSalonStore((s) => s.completeService);
  const reschedule = useSalonStore((s) => s.reschedule);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [staff, setStaff] = useState("all");
  const [open, setOpen] = useState<Appointment | null>(null);

  const list = useMemo(() => {
    return appointments
      .filter((a) => (status === "all" ? true : a.status === status))
      .filter((a) => (staff === "all" ? true : a.stylistId === staff))
      .filter((a) => {
        const hay = `${a.customerName} ${a.id} ${getService(a.serviceId)?.name ?? ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [appointments, q, status, staff]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Bookings</h1>
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bookings..." className="md:max-w-sm" />
        <select
          className="h-13 rounded-2xl border border-line bg-surface px-4 text-body"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="all">All statuses</option>
          {["confirmed", "checked_in", "in_service", "completed", "cancelled", "no_show"].map((s) => (
            <option key={s} value={s}>
              {statusLabel(s as AppointmentStatus)}
            </option>
          ))}
        </select>
        <select
          className="h-13 rounded-2xl border border-line bg-surface px-4 text-body"
          value={staff}
          onChange={(e) => setStaff(e.target.value)}
        >
          <option value="all">All staff</option>
          <option value="amina">Amina</option>
          <option value="sarah">Sarah</option>
          <option value="grace">Grace</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[24px] bg-surface">
        <table className="w-full min-w-[40rem] text-left text-support">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Staff</th>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr
                key={a.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-bg"
                onClick={() => setOpen(a)}
              >
                <td className="px-5 py-3 text-body">{a.customerName}</td>
                <td className="px-5 py-3">{getService(a.serviceId)?.name}</td>
                <td className="px-5 py-3">{getStylist(a.stylistId)?.name ?? "Any"}</td>
                <td className="px-5 py-3">
                  {formatShortDate(a.date)} · {formatClock(a.time)}
                </td>
                <td className="px-5 py-3">
                  <StatusPill status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30">
          <button type="button" className="flex-1" aria-label="Close" onClick={() => setOpen(null)} />
          <aside className="h-full w-full max-w-md overflow-y-auto bg-surface p-6">
            <div className="flex items-center justify-between">
              <p className="text-micro uppercase tracking-[0.16em] text-muted">Booking</p>
              <button type="button" onClick={() => setOpen(null)} className="text-support">
                Close
              </button>
            </div>
            <p className="mt-4 text-section font-normal">{open.customerName}</p>
            <p className="text-body text-muted">{getService(open.serviceId)?.name}</p>
            <p className="mt-4 text-body">
              {formatShortDate(open.date)} · {formatClock(open.time)}
            </p>
            <p className="text-support text-muted">
              {getStylist(open.stylistId)?.name ?? "Any"} · {open.id}
            </p>
            <div className="mt-4">
              <StatusPill status={open.status} />
            </div>
            <p className="mt-6 text-body tabular-nums">
              {formatTsh(open.deposit)} / {formatTsh(open.total)}
            </p>
            {open.notes && <p className="mt-4 text-body">{open.notes}</p>}
            <div className="mt-8 grid grid-cols-2 gap-2">
              {open.status === "confirmed" && (
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => {
                    checkIn(open.id);
                    setOpen(null);
                  }}
                >
                  Check in
                </Button>
              )}
              {open.status === "checked_in" && (
                <Button
                  className="h-11"
                  onClick={() => {
                    startService(open.id);
                    setOpen(null);
                  }}
                >
                  Start service
                </Button>
              )}
              {open.status === "in_service" && (
                <Button
                  className="h-11"
                  onClick={() => {
                    completeService(open.id);
                    setOpen(null);
                  }}
                >
                  Complete
                </Button>
              )}
              {(open.status === "confirmed" || open.status === "checked_in") && (
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => {
                    const next = window.prompt("New time (HH:MM)", open.time);
                    if (!next) return;
                    reschedule(open.id, open.date, next);
                    setOpen(null);
                  }}
                >
                  Reschedule
                </Button>
              )}
              <Button
                variant="danger"
                className="h-11"
                onClick={() => {
                  cancelAppointment(open.id);
                  setOpen(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <Link
              to="/admin/customers/$id"
              params={{ id: open.customerId }}
              className={cn("mt-4 block text-center text-support")}
            >
              View customer
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

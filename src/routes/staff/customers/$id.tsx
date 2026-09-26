import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ScreenHeader } from "@/components/salon/screen-header";
import { StatusPill } from "@/components/salon/status-pill";
import { getService } from "@/lib/salon/data";
import { formatShortDate } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/staff/customers/$id")({
  component: StaffCustomer,
});

function StaffCustomer() {
  const { id } = Route.useParams();
  const customer = useSalonStore((s) => s.customers.find((c) => c.id === id));
  const allAppointments = useSalonStore((s) => s.appointments);
  const appointments = allAppointments.filter((a) => a.customerId === id);
  const addNote = useSalonStore((s) => s.addCustomerNote);
  const [note, setNote] = useState("");

  if (!customer) {
    return (
      <main className="px-5 py-16 text-center">
        <p>Customer not found.</p>
        <Link to="/staff" className="mt-4 inline-block">
          Back
        </Link>
      </main>
    );
  }

  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-10">
      <ScreenHeader title="Customer" />
      <div className="px-5">
        <p className="text-title font-normal">{customer.name}</p>
        <p className="mt-1 text-body text-muted">{customer.phone}</p>
        <p className="mt-4 text-support text-muted">Customer since {customer.since}</p>
        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          <Mini n={appointments.length} label="Visits" />
          <Mini n={completed} label="Done" />
          <Mini n={cancelled} label="Cancelled" />
          <Mini n={noShow} label="No-show" />
        </div>

        <p className="mt-10 text-micro uppercase tracking-[0.16em] text-muted">Recent appointments</p>
        <ul className="mt-3 space-y-2">
          {appointments
            .slice()
            .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
            .slice(0, 8)
            .map((a) => (
              <li key={a.id}>
                <Link
                  to="/staff/appointments/$id"
                  params={{ id: a.id }}
                  className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3"
                >
                  <span>
                    <span className="block text-body">{getService(a.serviceId)?.name}</span>
                    <span className="text-support text-muted">{formatShortDate(a.date)}</span>
                  </span>
                  <StatusPill status={a.status} />
                </Link>
              </li>
            ))}
        </ul>

        <p className="mt-10 text-micro uppercase tracking-[0.16em] text-muted">Notes</p>
        {customer.notes ? (
          <p className="mt-3 whitespace-pre-wrap text-body">{customer.notes}</p>
        ) : (
          <p className="mt-3 text-body text-muted">No internal notes yet.</p>
        )}
        <Textarea className="mt-4" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
        <Button
          className="mt-3 h-12 w-full"
          disabled={!note.trim()}
          onClick={() => {
            addNote(customer.id, note.trim());
            setNote("");
          }}
        >
          Add note
        </Button>
      </div>
    </main>
  );
}

function Mini({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-surface py-3">
      <p className="font-display text-section tabular-nums">{n}</p>
      <p className="text-micro uppercase tracking-[0.08em] text-muted">{label}</p>
    </div>
  );
}

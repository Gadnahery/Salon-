import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusPill } from "@/components/salon/status-pill";
import { getService } from "@/lib/salon/data";
import { formatShortDate, formatTsh } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/customers/$id")({
  component: AdminCustomer,
});

function AdminCustomer() {
  const { id } = Route.useParams();
  const customer = useSalonStore((s) => s.customers.find((c) => c.id === id));
  const allAppointments = useSalonStore((s) => s.appointments);
  const allPayments = useSalonStore((s) => s.payments);
  const allReviews = useSalonStore((s) => s.reviews);
  const appointments = allAppointments.filter((a) => a.customerId === id);
  const payments = allPayments.filter((p) => p.customerId === id);
  const reviews = allReviews.filter((r) => appointments.some((a) => a.id === r.appointmentId));

  if (!customer) {
    return (
      <main className="px-8 py-16">
        <p>Customer not found.</p>
      </main>
    );
  }

  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <Link to="/admin/customers" className="text-support text-muted">
        Customers
      </Link>
      <h1 className="mt-3 text-title font-normal">{customer.name}</h1>
      <p className="mt-1 text-body text-muted">{customer.phone}</p>
      <p className="mt-2 text-support text-muted">Customer since {customer.since}</p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        <Mini n={appointments.length} l="Appointments" />
        <Mini n={completed} l="Completed" />
        <Mini n={cancelled} l="Cancelled" />
        <Mini n={noShow} l="No-show" />
      </div>

      {customer.notes && (
        <section className="mt-8 rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Notes</p>
          <p className="mt-3 whitespace-pre-wrap text-body">{customer.notes}</p>
        </section>
      )}

      <section className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Booking history</p>
        <ul className="mt-3 space-y-2">
          {appointments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
              <span>
                <span className="block text-body">{getService(a.serviceId)?.name}</span>
                <span className="text-support text-muted">
                  {formatShortDate(a.date)} · {a.id}
                </span>
              </span>
              <StatusPill status={a.status} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Payments</p>
        <ul className="mt-3 space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-body">
              <span>{p.description}</span>
              <span className="tabular-nums">{formatTsh(p.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      {reviews.length > 0 && (
        <section className="mt-8">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Reviews</p>
          <ul className="mt-3 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl bg-surface px-4 py-3 text-body">
                ★ {r.rating} · {r.quote}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-2xl bg-surface py-4 text-center">
      <p className="font-display text-section tabular-nums">{n}</p>
      <p className="text-micro uppercase tracking-[0.08em] text-muted">{l}</p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { formatTsh } from "@/lib/salon/format";
import { getService, getStylist } from "@/lib/salon/data";
import {
  bookingCounts,
  paidRevenue,
  peakDays,
  peakHours,
  revenueSeries,
  serviceDemand,
  staffUtilization,
  customerTrends,
} from "@/lib/engines/reporting";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/reports")({ component: Reports });

function Reports() {
  const appointments = useSalonStore((s) => s.appointments);
  const payments = useSalonStore((s) => s.payments);
  const customers = useSalonStore((s) => s.customers);
  const team = useSalonStore((s) => s.team);
  const reviews = useSalonStore((s) => s.reviews);

  const counts = bookingCounts(appointments);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRev = paidRevenue(payments, todayKey);
  const totalRev = paidRevenue(payments);
  const series = revenueSeries(payments, 14);
  const demand = serviceDemand(appointments).slice(0, 8);
  const hours = peakHours(appointments).slice(0, 6);
  const days = peakDays(appointments).slice(0, 7);
  const staff = staffUtilization(
    appointments,
    payments,
    team.filter((t) => t.role === "stylist" || t.role === "admin").map((t) => t.id),
  );
  const trends = customerTrends(customers, appointments);
  const walkInRev = payments
    .filter((p) => p.status === "paid")
    .filter((p) => {
      const a = appointments.find((x) => x.id === p.bookingId);
      return a?.source === "walk_in";
    })
    .reduce((s, p) => s + p.amount, 0);
  const onlineRev = Math.max(0, totalRev - walkInRev);
  const ratingByStaff = (id: string) => {
    const list = reviews.filter((r) => r.stylistId === id && r.published);
    if (!list.length) return null;
    return Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Sales & insights</h1>
      <p className="mt-2 text-body text-muted">Online bookings and walk-in revenue in one place.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today", value: formatTsh(todayRev) },
          { label: "All paid revenue", value: formatTsh(totalRev) },
          { label: "Online", value: formatTsh(onlineRev) },
          { label: "Walk-in", value: formatTsh(walkInRev) },
        ].map((c) => (
          <div key={c.label} className="rounded-[24px] bg-surface p-5">
            <p className="text-support text-muted">{c.label}</p>
            <p className="mt-2 text-section font-normal">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Bookings", value: counts.total },
          { label: "Completed", value: counts.completed },
          { label: "Cancelled", value: counts.cancelled },
          { label: "No-shows", value: counts.noShow },
        ].map((c) => (
          <div key={c.label} className="rounded-[20px] border border-line p-4">
            <p className="text-support text-muted">{c.label}</p>
            <p className="mt-1 text-body font-medium">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-section font-normal">Last 14 days revenue</h2>
        <ul className="mt-4 flex items-end gap-1.5 overflow-x-auto pb-2">
          {series.map((d) => {
            const max = Math.max(...series.map((x) => x.value), 1);
            const h = Math.max(8, Math.round((d.value / max) * 96));
            return (
              <li key={d.key} className="flex w-8 flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-ink" style={{ height: h }} title={formatTsh(d.value)} />
                <span className="text-[10px] text-muted">{d.day}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-section font-normal">Most booked services</h2>
          <ul className="mt-4 space-y-2">
            {demand.map((r) => (
              <li key={r.serviceId} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                <span className="text-body">{getService(r.serviceId)?.name ?? r.serviceId}</span>
                <span className="text-support text-muted">
                  {r.n} · {r.pct}%
                </span>
              </li>
            ))}
            {demand.length === 0 && <p className="text-support text-muted">No bookings yet.</p>}
          </ul>
        </section>
        <section>
          <h2 className="text-section font-normal">Peak hours</h2>
          <ul className="mt-4 space-y-2">
            {hours.map((r) => (
              <li key={r.hour} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                <span className="text-body">{r.hour}</span>
                <span className="text-support text-muted">{r.n} bookings</span>
              </li>
            ))}
            {hours.length === 0 && <p className="text-support text-muted">No data yet.</p>}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-section font-normal">Staff performance</h2>
        <ul className="mt-4 space-y-2">
          {staff.map((r) => (
            <li key={r.staffId} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
              <span className="text-body">{getStylist(r.staffId)?.name ?? r.staffId}</span>
              <span className="text-support text-muted">
                {r.completed}/{r.bookings} done · {formatTsh(r.revenue)}
                {ratingByStaff(r.staffId) != null ? ` · ★ ${ratingByStaff(r.staffId)}` : ""}
              </span>
            </li>
          ))}
          {staff.length === 0 && <p className="text-support text-muted">No staff revenue yet.</p>}
        </ul>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-line p-4">
          <p className="text-support text-muted">New customers</p>
          <p className="mt-1 text-body font-medium">{trends.newCustomers}</p>
        </div>
        <div className="rounded-[20px] border border-line p-4">
          <p className="text-support text-muted">Returning</p>
          <p className="mt-1 text-body font-medium">{trends.returning}</p>
        </div>
        <div className="rounded-[20px] border border-line p-4">
          <p className="text-support text-muted">Avg booking value</p>
          <p className="mt-1 text-body font-medium">{formatTsh(trends.averageBookingValue)}</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-section font-normal">Busy days</h2>
        <ul className="mt-4 space-y-2">
          {days.map((r) => (
            <li key={r.date} className="flex justify-between rounded-2xl bg-surface px-4 py-3 text-body">
              <span>{r.date}</span>
              <span className="text-muted">{r.n}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

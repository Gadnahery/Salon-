import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { getService } from "@/lib/salon/data";
import { formatTsh } from "@/lib/salon/format";
import { bookingCounts, customerTrends, paidRevenue, revenueSeries, serviceDemand } from "@/lib/engines/reporting";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

function AdminReports() {
  const appointments = useSalonStore((s) => s.appointments);
  const payments = useSalonStore((s) => s.payments);
  const customers = useSalonStore((s) => s.customers);
  const revenue = paidRevenue(payments);
  const counts = bookingCounts(appointments);
  const demand = serviceDemand(appointments);
  const chart = revenueSeries(payments, 14).map((d) => ({ day: d.day, n: d.value }));
  const trends = customerTrends(customers, appointments);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Reports</h1>
      <section className="mt-8 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Revenue</p>
        <p className="mt-2 font-display text-title tabular-nums">{formatTsh(revenue)}</p>
        <p className="mt-1 text-support text-muted">{format(new Date(), "MMMM yyyy")}</p>
      </section>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile l="Total" n={counts.total} />
        <Tile l="Completed" n={counts.completed} />
        <Tile l="Cancelled" n={counts.cancelled} />
        <Tile l="No-show" n={counts.noShow} />
        <Tile l="Pending" n={counts.pending} />
      </div>
      <section className="mt-6 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Revenue over time</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#706d69" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatTsh(v)} contentStyle={{ borderRadius: 16, border: "1px solid #e7e3de" }} />
              <Bar dataKey="n" fill="#181716" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="mt-6 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Service demand</p>
        <ul className="mt-4 space-y-3">
          {demand.map((d) => (
            <li key={d.serviceId}>
              <div className="flex justify-between text-body">
                <span>{getService(d.serviceId)?.name ?? d.serviceId}</span>
                <span className="tabular-nums text-muted">{d.pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-brand" style={{ width: `${d.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile l="Customers on file" n={customers.length} />
        <Tile l="New" n={trends.newCustomers} />
        <Tile l="Returning" n={trends.returning} />
        <Tile l="Repeat rate" n={trends.repeatRate} suffix="%" />
      </section>
      <p className="mt-4 text-support text-muted">Average booking value {formatTsh(trends.averageBookingValue)}</p>
    </main>
  );
}

function Tile({ l, n, suffix }: { l: string; n: number; suffix?: string }) {
  return (
    <div className="rounded-[24px] bg-surface p-5">
      <p className="text-support text-muted">{l}</p>
      <p className="mt-2 font-display text-title tabular-nums">
        {n}
        {suffix ?? ""}
      </p>
    </div>
  );
}

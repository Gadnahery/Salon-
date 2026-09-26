import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import { formatClock, formatTsh, greeting } from "@/lib/salon/format";
import { todayKey } from "@/lib/engines/schedule";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const hydrated = useHydrated();
  const appointments = useSalonStore((s) => s.appointments);
  const payments = useSalonStore((s) => s.payments);
  const customers = useSalonStore((s) => s.customers);
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "admin" && !n.read);
  const today = todayKey();
  const todays = appointments.filter((a) => a.date === today);
  const ops = {
    all: todays.length,
    confirmed: todays.filter((a) => a.status === "confirmed").length,
    checked_in: todays.filter((a) => a.status === "checked_in").length,
    in_service: todays.filter((a) => a.status === "in_service").length,
    completed: todays.filter((a) => a.status === "completed").length,
    cancelled: todays.filter((a) => a.status === "cancelled").length,
    no_show: todays.filter((a) => a.status === "no_show").length,
  };
  const revenueToday = payments
    .filter((p) => p.status === "paid" && p.completedAt?.slice(0, 10) === today)
    .reduce((s, p) => s + p.amount, 0);
  const revenueAll = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const waiting = todays.filter((a) => a.status === "checked_in").length;
  const pendingPay = todays.filter((a) => a.remaining > 0 && a.status !== "cancelled").length;

  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = format(d, "yyyy-MM-dd");
    const value = payments
      .filter((p) => p.status === "paid" && (p.completedAt ?? p.createdAt).slice(0, 10) === key)
      .reduce((s, p) => s + p.amount, 0);
    return { day: format(d, "EEE"), value };
  });

  const demand: Record<string, number> = {};
  for (const a of appointments) {
    if (a.status === "cancelled" || a.status === "expired") continue;
    demand[a.serviceId] = (demand[a.serviceId] ?? 0) + 1;
  }
  const popular = Object.entries(demand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const staffToday = ["amina", "sarah", "grace"].map((id) => {
    const mine = todays.filter((a) => a.stylistId === id);
    return {
      id,
      name: getStylist(id)?.name ?? id,
      all: mine.length,
      done: mine.filter((a) => a.status === "completed").length,
    };
  });

  const schedule = [...todays].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 8);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-micro uppercase tracking-[0.16em] text-muted">{greeting()}, Lewis</p>
          <h1 className="mt-2 text-title font-normal">Here’s what’s happening at {SALON.short} today.</h1>
        </div>
        <p className="text-support text-muted">{format(new Date(), "d MMM yyyy")} · Today</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Appointments" value={String(ops.all)} />
        <Metric label="Revenue" value={hydrated ? formatTsh(revenueToday) : "—"} />
        <Metric label="Completed" value={String(ops.completed)} />
        <Metric label="Customers" value={`${customers.length}`} hint="on file" />
      </div>

      <section className="mt-8 rounded-[24px] bg-surface p-5">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">Today’s operations</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-support">
          <span>Appointments {ops.all}</span>
          <span>Confirmed {ops.confirmed}</span>
          <span>Checked in {ops.checked_in}</span>
          <span>In service {ops.in_service}</span>
          <span>Completed {ops.completed}</span>
          <span>Cancelled {ops.cancelled}</span>
          <span>No-show {ops.no_show}</span>
        </div>
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line">
          <span className="bg-success" style={{ width: `${pct(ops.completed, ops.all)}%` }} />
          <span className="bg-brand" style={{ width: `${pct(ops.in_service, ops.all)}%` }} />
          <span className="bg-ink/40" style={{ width: `${pct(ops.checked_in, ops.all)}%` }} />
          <span className="bg-muted/40" style={{ width: `${pct(ops.confirmed, ops.all)}%` }} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-[24px] bg-surface p-5 lg:col-span-3">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Today’s schedule</p>
          <ul className="mt-4">
            {schedule.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                <div className="flex gap-4">
                  <p className="w-16 text-support tabular-nums text-muted">{formatClock(a.time)}</p>
                  <div>
                    <p className="text-body">{a.customerName}</p>
                    <p className="text-support text-muted">
                      {getService(a.serviceId)?.name} · {getStylist(a.stylistId)?.name ?? "Any"}
                    </p>
                  </div>
                </div>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[24px] bg-surface p-5 lg:col-span-2">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Needs attention</p>
          <ul className="mt-4 space-y-3">
            <Attn to="/admin/bookings" label={`${ops.confirmed} confirmed bookings`} />
            <Attn to="/admin/payments" label={`${pendingPay} payments still open`} />
            <Attn to="/admin/queue" label={`${waiting} customers waiting`} />
            {notices.slice(0, 3).map((n) => (
              <Attn key={n.id} to="/admin/notifications" label={n.title} />
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-[24px] bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Revenue</p>
          <p className="text-body tabular-nums">{hydrated ? formatTsh(revenueAll) : "—"} recorded</p>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#706d69" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatTsh(v)}
                contentStyle={{ borderRadius: 16, border: "1px solid #e7e3de" }}
              />
              <Line type="monotone" dataKey="value" stroke="#a85f3f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Popular services</p>
          <ul className="mt-4 space-y-3">
            {popular.map(([id, n]) => (
              <li key={id} className="flex items-center justify-between text-body">
                <span>{getService(id)?.name ?? id}</span>
                <span className="tabular-nums text-muted">{n} bookings</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Staff today</p>
          <ul className="mt-4 space-y-3">
            {staffToday.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-body">
                <span>{s.name}</span>
                <span className="text-support text-muted">
                  {s.all} appointments · {s.done} completed
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[24px] bg-surface p-5">
      <p className="text-support text-muted">{label}</p>
      <p className="mt-2 font-display text-title tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-support text-muted">{hint}</p>}
    </div>
  );
}

function Attn({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="block rounded-2xl bg-bg px-4 py-3 text-body hover:bg-brand-soft">
        {label}
      </Link>
    </li>
  );
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

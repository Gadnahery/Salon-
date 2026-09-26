import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatTsh } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/customers/")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const customers = useSalonStore((s) => s.customers);
  const appointments = useSalonStore((s) => s.appointments);
  const payments = useSalonStore((s) => s.payments);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "new" | "returning">("all");

  const rows = useMemo(() => {
    return customers
      .filter((c) => {
        if (tab === "returning") return c.returning;
        if (tab === "new") return !c.returning;
        return true;
      })
      .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))
      .map((c) => {
        const visits = appointments.filter((a) => a.customerId === c.id);
        const last = visits.sort((a, b) => b.date.localeCompare(a.date))[0];
        const spent = payments
          .filter((p) => p.customerId === c.id && p.status === "paid")
          .reduce((s, p) => s + p.amount, 0);
        return { c, visits: visits.length, last, spent };
      });
  }, [customers, appointments, payments, q, tab]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Customers</h1>
      <Input className="mt-5 max-w-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers..." />
      <div className="mt-4 flex gap-2">
        {(["all", "new", "returning"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-10 rounded-full px-4 text-support capitalize ${tab === t ? "bg-ink text-white" : "border border-line"}`}
          >
            {t === "all" ? "All customers" : t}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-[24px] bg-surface">
        <table className="w-full min-w-[36rem] text-left text-support">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Visits</th>
              <th className="px-5 py-3 font-medium">Last visit</th>
              <th className="px-5 py-3 font-medium">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, visits, last, spent }) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <Link to="/admin/customers/$id" params={{ id: c.id }} className="text-body">
                    {c.name}
                  </Link>
                  <p className="text-muted">{c.phone}</p>
                </td>
                <td className="px-5 py-3 tabular-nums">{visits}</td>
                <td className="px-5 py-3">{last?.date ?? "—"}</td>
                <td className="px-5 py-3 tabular-nums">{formatTsh(spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

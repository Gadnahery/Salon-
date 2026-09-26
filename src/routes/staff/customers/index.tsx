import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/staff/customers/")({
  component: StaffCustomers,
});

function StaffCustomers() {
  const customers = useSalonStore((s) => s.customers);
  const appointments = useSalonStore((s) => s.appointments);
  const [q, setQ] = useState("");
  const list = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
  );

  return (
    <main className="mx-auto max-w-lg px-5 pb-28 pt-6">
      <h1 className="text-title font-normal">Customers</h1>
      <Input className="mt-5" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" />
      <ul className="mt-5 space-y-2">
        {list.map((c) => {
          const visits = appointments.filter((a) => a.customerId === c.id).length;
          return (
            <li key={c.id}>
              <Link
                to="/staff/customers/$id"
                params={{ id: c.id }}
                className="flex items-center justify-between rounded-[20px] bg-surface px-4 py-4"
              >
                <span>
                  <span className="block text-body font-medium">{c.name}</span>
                  <span className="text-support text-muted">{c.phone}</span>
                </span>
                <span className="text-support text-muted">{visits} visits</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

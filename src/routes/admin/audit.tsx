import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/admin/audit")({ component: AdminAudit });

function AdminAudit() {
  const audit = useSalonStore((s) => s.audit);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Audit log</h1>
      <p className="mt-2 text-body text-muted">Who changed what, and when.</p>
      <ul className="mt-8">
        {audit.map((e) => (
          <li key={e.id} className="border-b border-line py-5">
            <p className="text-support text-muted">{format(new Date(e.at), "d MMM · h:mm a")}</p>
            <p className="mt-1 text-body">
              {e.actor} {e.action}
            </p>
            <p className="mt-1 text-support text-muted">
              {e.target}
              {e.before || e.after ? ` · ${e.before ?? "—"} → ${e.after ?? "—"}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

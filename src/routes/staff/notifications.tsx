import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/staff/notifications")({
  component: StaffNotifications,
});

function StaffNotifications() {
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "staff");
  const mark = useSalonStore((s) => s.markNoticesRead);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) mark("staff");
  }, [hydrated, mark]);

  return (
    <main className="mx-auto max-w-lg px-5 pb-28 pt-6">
      <h1 className="text-title font-normal">Notifications</h1>
      <ul className="mt-6">
        {hydrated && notices.length === 0 && (
          <p className="pt-16 text-center text-body text-muted">Nothing needs you right now.</p>
        )}
        {notices.map((n) => (
          <li key={n.id} className="border-b border-line py-5">
            {n.appointmentId ? (
              <Link to="/staff/appointments/$id" params={{ id: n.appointmentId }} className="block">
                <Notice n={n} />
              </Link>
            ) : (
              <Notice n={n} />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

function Notice({ n }: { n: { title: string; body: string; time: string; read: boolean } }) {
  return (
    <>
      <p className="text-body font-medium">{n.title}</p>
      <p className="mt-1 text-body text-muted">{n.body}</p>
      <p className="mt-2 text-support text-muted">
        {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
      </p>
    </>
  );
}

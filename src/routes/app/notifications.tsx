import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ScreenHeader } from "@/components/salon/screen-header";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "customer");
  const mark = useSalonStore((s) => s.markNoticesRead);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) mark("customer");
  }, [hydrated, mark]);

  return (
    <main className="mx-auto min-h-dvh max-w-lg">
      <ScreenHeader title="Notifications" backTo="/app" />
      <ul className="px-5 pb-10">
        {hydrated && notices.length === 0 && (
          <p className="pt-16 text-center text-body text-muted">You're all caught up.</p>
        )}
        {hydrated &&
          notices.map((n) => (
            <li key={n.id} className="border-b border-line py-5">
              {n.appointmentId ? (
                <Link to="/app/appointments/$id" params={{ id: n.appointmentId }} className="block">
                  <p className="text-body font-medium">{n.title}</p>
                  <p className="mt-1 text-body text-muted">{n.body}</p>
                  <p className="mt-2 text-support text-muted">
                    {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                  </p>
                </Link>
              ) : (
                <>
                  <p className="text-body font-medium">{n.title}</p>
                  <p className="mt-1 text-body text-muted">{n.body}</p>
                </>
              )}
            </li>
          ))}
      </ul>
    </main>
  );
}

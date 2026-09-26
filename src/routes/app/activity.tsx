import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSalonStore } from "@/lib/salon/store";
import { useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/app/activity")({ component: ActivityPage });

function ActivityPage() {
  const noticesAll = useSalonStore((s) => s.notices);
  const notices = noticesAll.filter((n) => n.audience === "customer");
  const mark = useSalonStore((s) => s.markNoticesRead);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) mark("customer");
  }, [hydrated, mark]);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-10 pt-6">
      <h1 className="text-title font-normal">Activity</h1>
      <ul className="mt-6">
        {hydrated && notices.length === 0 && (
          <p className="pt-16 text-center text-body text-muted">You're all caught up.</p>
        )}
        {hydrated &&
          notices.map((n) => (
            <li key={n.id} className="border-b border-line py-5">
              {n.appointmentId ? (
                <Link to="/app/appointments/$id" params={{ id: n.appointmentId }} className="block">
                  <NoticeBody title={n.title} body={n.body} time={n.time} unread={!n.read} />
                </Link>
              ) : (
                <NoticeBody title={n.title} body={n.body} time={n.time} unread={!n.read} />
              )}
            </li>
          ))}
      </ul>
    </main>
  );
}

function NoticeBody({
  title,
  body,
  time,
  unread,
}: {
  title: string;
  body: string;
  time: string;
  unread: boolean;
}) {
  return (
    <div>
      <p className="text-body font-medium">
        {unread && <span className="mr-2 inline-block size-1.5 rounded-full bg-brand" />}
        {title}
      </p>
      <p className="mt-1 text-body text-muted">{body}</p>
      <p className="mt-2 text-support text-muted">
        {formatDistanceToNow(new Date(time), { addSuffix: true })}
      </p>
    </div>
  );
}

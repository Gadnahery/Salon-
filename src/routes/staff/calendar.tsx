import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isToday, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist } from "@/lib/salon/data";
import { formatClock } from "@/lib/salon/format";
import { useStaffAppointments } from "@/lib/salon/store";
import { cn, useHydrated } from "@/lib/utils";

export const Route = createFileRoute("/staff/calendar")({ component: StaffCalendar });

function StaffCalendar() {
  const [view, setView] = useState<"day" | "week">("day");
  const [offset, setOffset] = useState(0);
  const appointments = useStaffAppointments();
  const hydrated = useHydrated();
  const day = addDays(new Date(), offset);
  const key = format(day, "yyyy-MM-dd");
  const list = appointments.filter((a) => a.date === key).sort((a, b) => a.time.localeCompare(b.time));
  const week = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(new Date(), i)), []);
  const now = new Date();
  const nowLabel = format(now, "HH:mm");

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Calendar</p>
          <h1 className="mt-1 text-title font-normal">{format(day, "MMMM yyyy")}</h1>
        </div>
        <div className="flex rounded-full border border-line p-1">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn("h-9 rounded-full px-4 text-support capitalize", view === v && "bg-ink text-surface")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "week" ? (
        <div className="mt-6 space-y-4">
          {week.map((d) => {
            const k = format(d, "yyyy-MM-dd");
            const items = appointments.filter((a) => a.date === k).sort((a, b) => a.time.localeCompare(b.time));
            return (
              <section key={k}>
                <p className="text-support font-medium">
                  {format(d, "EEE d")}
                  {isToday(d) ? " · Today" : ""}
                </p>
                <ul className="mt-2 space-y-2">
                  {items.map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/staff/appointments/$id"
                        params={{ id: a.id }}
                        className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3"
                      >
                        <span>
                          <span className="block text-body">{a.customerName}</span>
                          <span className="text-support text-muted">
                            {formatClock(a.time)} · {getService(a.serviceId)?.name}
                          </span>
                        </span>
                        <StatusPill status={a.status} />
                      </Link>
                    </li>
                  ))}
                  {items.length === 0 && <p className="text-support text-muted">Open</p>}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <button type="button" className="text-support" onClick={() => setOffset((n) => n - 1)}>
              Previous
            </button>
            <p className="text-body font-medium">{isToday(day) ? "Today" : format(day, "EEEE d MMM")}</p>
            <button type="button" className="text-support" onClick={() => setOffset((n) => n + 1)}>
              Next
            </button>
          </div>
          <ol className="mt-6">
            {hydrated && isToday(day) && (
              <li className="mb-4 flex items-center gap-3 text-support text-brand">
                <span className="h-px flex-1 bg-brand/40" />
                NOW {formatClock(nowLabel)}
                <span className="h-px flex-1 bg-brand/40" />
              </li>
            )}
            {list.map((a) => (
              <li key={a.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
                <p className="pt-1 text-support tabular-nums text-muted">{formatClock(a.time)}</p>
                <Link
                  to="/staff/appointments/$id"
                  params={{ id: a.id }}
                  className="mb-4 rounded-[20px] bg-surface p-4"
                >
                  <p className="text-body font-medium">{a.customerName}</p>
                  <p className="text-support text-muted">
                    {getService(a.serviceId)?.name}
                    {" · "}
                    {getStylist(a.stylistId)?.name ?? "Any"}
                  </p>
                  <div className="mt-2">
                    <StatusPill status={a.status} />
                  </div>
                </Link>
              </li>
            ))}
            {aLunch(list) && (
              <li className="grid grid-cols-[4.5rem_1fr] gap-3">
                <p className="pt-1 text-support text-muted">12:00</p>
                <p className="mb-4 rounded-[20px] border border-dashed border-line px-4 py-3 text-support text-muted">
                  Lunch / Break
                </p>
              </li>
            )}
            {list.length === 0 && <p className="pt-8 text-body text-muted">No appointments this day.</p>}
          </ol>
        </>
      )}
    </main>
  );
}

function aLunch(list: { time: string }[]) {
  return !list.some((a) => a.time === "12:00");
}

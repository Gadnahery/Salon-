import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, startOfWeek } from "date-fns";
import { useState } from "react";
import { getService, getStylist, stylistsOnTeam } from "@/lib/salon/data";
import { formatClock } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/calendar")({ component: AdminCalendar });

function AdminCalendar() {
  const appointments = useSalonStore((s) => s.appointments);
  const [staff, setStaff] = useState("all");
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i));
  const team = stylistsOnTeam();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-normal">Calendar</h1>
          <p className="mt-1 text-support text-muted">{format(start, "MMMM yyyy")}</p>
        </div>
        <select
          className="h-11 rounded-2xl border border-line bg-surface px-4 text-support"
          value={staff}
          onChange={(e) => setStaff(e.target.value)}
        >
          <option value="all">All staff</option>
          {team.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const items = appointments
            .filter((a) => a.date === key && (staff === "all" || a.stylistId === staff))
            .filter((a) => a.status !== "cancelled")
            .sort((a, b) => a.time.localeCompare(b.time));
          return (
            <section
              key={key}
              className="w-[13.5rem] shrink-0 rounded-[20px] bg-surface p-3 lg:w-auto lg:min-w-0 lg:flex-1"
            >
              <p className="text-support font-medium">{format(d, "EEE d")}</p>
              <ul className="mt-3 space-y-2">
                {items.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/admin/bookings"
                      className={cn(
                        "block rounded-xl px-2 py-2 text-micro leading-snug",
                        a.status === "in_service"
                          ? "bg-brand-soft"
                          : a.status === "completed"
                            ? "bg-bg text-muted"
                            : "bg-bg",
                      )}
                    >
                      <span className="block font-medium text-support">{formatClock(a.time)}</span>
                      {a.customerName.split(" ")[0]}
                      <span className="block text-muted">
                        {getService(a.serviceId)?.name}
                        {staff === "all" ? ` · ${getStylist(a.stylistId)?.name ?? ""}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/salon/format";
import type { AppointmentStatus, QueueStatus, ShiftStatus } from "@/lib/salon/types";

const tone: Record<string, string> = {
  requested: "text-warning",
  payment_pending: "text-warning",
  confirmed: "text-muted",
  checked_in: "text-ink",
  in_service: "text-brand",
  completed: "text-success",
  cancelled: "text-danger",
  no_show: "text-danger",
  expired: "text-muted",
  waiting: "text-warning",
  removed: "text-muted",
  available: "text-success",
  busy: "text-brand",
  on_break: "text-warning",
  offline: "text-muted",
};

const dot: Record<string, string> = {
  requested: "bg-warning",
  payment_pending: "bg-warning",
  confirmed: "bg-muted",
  checked_in: "bg-ink",
  in_service: "bg-brand",
  completed: "bg-success",
  cancelled: "bg-danger",
  no_show: "bg-danger",
  expired: "bg-muted",
  waiting: "bg-warning",
  removed: "bg-muted",
  available: "bg-success",
  busy: "bg-brand",
  on_break: "bg-warning",
  offline: "bg-muted",
};

const extraLabel: Record<string, string> = {
  waiting: "Waiting",
  removed: "Removed",
  available: "Available",
  busy: "Busy",
  on_break: "On break",
  offline: "Offline",
};

type Status = AppointmentStatus | QueueStatus | ShiftStatus | string;

function labelFor(status: Status): string {
  const key = String(status);
  const appt = statusLabel(key as AppointmentStatus);
  if (appt) return appt;
  if (extraLabel[key]) return extraLabel[key];
  return key.replace(/_/g, " ");
}

export function StatusPill({
  status,
  className,
  label,
}: {
  status: Status;
  className?: string;
  label?: string;
}) {
  const key = String(status);
  const live = key === "in_service" || key === "payment_pending" || key === "waiting";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-micro uppercase tracking-[0.12em]",
        tone[key] ?? "text-muted",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {live && (
          <span
            className={cn("absolute inset-0 rounded-full opacity-50 animate-ping", dot[key] ?? "bg-muted")}
            style={{ animationDuration: "1.8s" }}
            aria-hidden
          />
        )}
        <span className={cn("relative size-1.5 rounded-full", dot[key] ?? "bg-muted")} />
      </span>
      {label ?? labelFor(status)}
    </span>
  );
}

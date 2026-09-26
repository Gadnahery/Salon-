import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/salon/format";
import type { AppointmentStatus, QueueStatus, ShiftStatus } from "@/lib/salon/types";

const tone: Record<string, string> = {
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

export function StatusPill({
  status,
  label,
}: {
  status: AppointmentStatus | QueueStatus | ShiftStatus | string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-support", tone[status] ?? "text-muted")}>
      <span className={cn("size-1.5 rounded-full", dot[status] ?? "bg-muted")} />
      {label ?? (status in tone ? statusLabel(status as AppointmentStatus) : status.replace("_", " "))}
    </span>
  );
}

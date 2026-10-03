import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { m, useMotionValue, useTransform, animate } from "motion/react";
import { StatusPill } from "@/components/salon/status-pill";
import { getService } from "@/lib/salon/data";
import { formatClock } from "@/lib/salon/format";
import type { Appointment } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;

/**
 * Staff timeline row: swipe right to Start (when checked_in), left for No-show
 * (when confirmed / checked_in). Destructive actions stay behind a confirm callback.
 */
export function SwipeAppointmentRow({
  appointment: a,
  onStart,
  onNoShow,
}: {
  appointment: Appointment;
  onStart?: (id: string) => void;
  onNoShow?: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const canStart = a.status === "checked_in" && !!onStart;
  const canNoShow =
    (a.status === "confirmed" || a.status === "checked_in") && !!onNoShow;
  const startOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const noShowOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
  const dragging = useRef(false);
  const [busy, setBusy] = useState(false);

  async function snapBack() {
    await animate(x, 0, { type: "spring", stiffness: 480, damping: 36 });
  }

  return (
    <li className="relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-success/15">
        <m.span style={{ opacity: startOpacity }} className="text-support font-medium text-success">
          Start
        </m.span>
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-danger/15">
        <m.span style={{ opacity: noShowOpacity }} className="text-support font-medium text-danger">
          No-show
        </m.span>
      </div>

      <m.div
        style={{ x }}
        drag={busy ? false : "x"}
        dragConstraints={{ left: canNoShow ? -120 : 0, right: canStart ? 120 : 0 }}
        dragElastic={0.12}
        onDragStart={() => {
          dragging.current = true;
        }}
        onDragEnd={async (_, info) => {
          const ox = info.offset.x;
          if (canStart && ox > THRESHOLD) {
            setBusy(true);
            onStart?.(a.id);
            await snapBack();
            setBusy(false);
          } else if (canNoShow && ox < -THRESHOLD) {
            setBusy(true);
            onNoShow?.(a.id);
            await snapBack();
            setBusy(false);
          } else {
            await snapBack();
          }
          // allow click after short delay
          setTimeout(() => {
            dragging.current = false;
          }, 50);
        }}
        className="relative grid grid-cols-[4.5rem_1fr] gap-3 bg-bg"
      >
        <p className="pt-1 text-support tabular-nums text-muted">{formatClock(a.time)}</p>
        <Link
          to="/staff/appointments/$id"
          params={{ id: a.id }}
          className={cn("border-l border-line pb-5 pl-4", dragging.current && "pointer-events-none")}
          onClick={(e) => {
            if (dragging.current) e.preventDefault();
          }}
        >
          <p className="text-body font-medium">{a.customerName}</p>
          <p className="text-support text-muted">{getService(a.serviceId)?.name}</p>
          <div className="mt-1">
            <StatusPill status={a.status} />
          </div>
        </Link>
      </m.div>
    </li>
  );
}

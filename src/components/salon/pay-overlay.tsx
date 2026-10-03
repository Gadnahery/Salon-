import { displayLocalPhone, formatTsh } from "@/lib/salon/format";
import { Button } from "@/components/ui/button";
import { m } from "motion/react";

export function PayOverlay({
  phase,
  phone,
  amount,
  onCancel,
  hint,
}: {
  phase: "waiting" | "confirming" | "sending";
  phone: string;
  amount: number;
  onCancel?: () => void;
  hint?: string;
}) {
  const shown = displayLocalPhone(phone);
  const title =
    phase === "sending"
      ? "Sending payment request…"
      : phase === "waiting"
        ? "Waiting for USSD on your phone"
        : "Confirming payment";

  const body =
    phase === "sending"
      ? "Contacting HarakaPay. This should take a few seconds."
      : phase === "waiting"
        ? `Approve the USSD prompt on ${shown || "your phone"} for ${formatTsh(amount)}. Do not leave this screen until it finishes or fails.`
        : "Please don't pay again.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 px-6 backdrop-blur-sm">
      <m.span
        className="relative flex size-20 items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <span className="pulse-ring absolute inset-0 rounded-full border border-silver/60" />
        <span className="absolute inset-2 rounded-full border border-line/50" />
        <span className="size-2.5 rounded-full bg-ink" />
      </m.span>
      <m.p
        className="mt-8 text-center font-display text-title font-normal"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
      >
        {title}
      </m.p>
      <p className="mt-2 max-w-xs text-center text-body text-muted">{body}</p>
      {hint && <p className="mt-3 max-w-xs text-center text-support text-silver">{hint}</p>}
      <p className="mt-4 font-display text-section tabular-nums text-ink">{formatTsh(amount)}</p>
      {onCancel && phase !== "confirming" && (
        <Button type="button" variant="secondary" className="mt-8 h-12 px-8" onClick={onCancel}>
          Cancel
        </Button>
      )}
      {phase === "waiting" && (
        <p className="mt-4 max-w-xs text-center text-support text-muted">
          Cancelling stops waiting here. Decline any open USSD on the phone so you are not charged twice.
        </p>
      )}
    </div>
  );
}

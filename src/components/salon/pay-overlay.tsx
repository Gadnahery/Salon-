import { formatTsh } from "@/lib/salon/format";
import { Button } from "@/components/ui/button";

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
        ? `Approve the USSD prompt on ${phone || "your phone"} for ${formatTsh(amount)}. Do not leave this screen until it finishes or fails.`
        : "Please don't pay again.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6">
      <span className="relative flex size-16 items-center justify-center">
        <span className="pulse-ring absolute inset-0 rounded-full border border-ink" />
        <span className="size-2.5 rounded-full bg-ink" />
      </span>
      <p className="mt-8 text-center text-title font-normal">{title}</p>
      <p className="mt-2 max-w-xs text-center text-body text-muted">{body}</p>
      {hint && <p className="mt-3 max-w-xs text-center text-support text-brand">{hint}</p>}
      {onCancel && phase !== "confirming" && (
        <Button type="button" variant="secondary" className="mt-8 h-12 px-8" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}

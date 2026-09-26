import { formatTsh } from "@/lib/salon/format";

export function PayOverlay({
  phase,
  phone,
  amount,
}: {
  phase: "waiting" | "confirming";
  phone: string;
  amount: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-6">
      <span className="relative flex size-16 items-center justify-center">
        <span className="pulse-ring absolute inset-0 rounded-full border border-ink" />
        <span className="size-2.5 rounded-full bg-ink" />
      </span>
      <p className="mt-8 text-title font-normal">
        {phase === "waiting" ? "Waiting for payment" : "We're confirming your payment"}
      </p>
      <p className="mt-2 max-w-xs text-center text-body text-muted">
        {phase === "waiting"
          ? `Approve the USSD prompt on ${phone} for ${formatTsh(amount)}. This can take up to a minute.`
          : "Please don't pay again."}
      </p>
    </div>
  );
}
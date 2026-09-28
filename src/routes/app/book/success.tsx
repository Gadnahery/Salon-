import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import { formatClock, formatLongDate, formatTsh } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";

type Search = { id?: string };

export const Route = createFileRoute("/app/book/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();
  const appt = useSalonStore((s) => s.appointments.find((a) => a.id === id));
  const service = appt ? getService(appt.serviceId) : undefined;
  const stylist = appt && !appt.anyStylist ? getStylist(appt.stylistId) : undefined;

  const waiting = appt?.status === "requested" || (appt?.needsProviderConfirm && !appt?.providerConfirmed);
  const needsPay = appt?.status === "payment_pending" || (appt?.providerConfirmed && appt?.remaining > 0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-12 pt-16">
      <div className="text-center">
        <svg viewBox="0 0 48 48" className="mx-auto size-16" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="none" className="stroke-line" strokeWidth="1.5" />
          <path
            d="M14 24.5 L21 31.5 L34 16.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="draw-check text-success"
          />
        </svg>
        <h1 className="mt-6 text-title font-normal">
          {waiting ? "Request sent" : needsPay ? "Confirmed — pay deposit" : "You're booked"}
        </h1>
        <p className="mt-2 text-body text-muted">
          {waiting
            ? "The salon will confirm your time. You'll pay after they accept."
            : needsPay
              ? "Your time is held. Complete payment to finish the booking."
              : "Your appointment is confirmed."}
        </p>
      </div>

      {service && appt && (
        <div className="mt-10 rounded-[24px] border border-line bg-surface px-5 py-6">
          <p className="text-section font-normal">{service.name}</p>
          <p className="mt-1 text-body text-muted">
            {stylist ? `${stylist.name} · ${stylist.title}` : "Stylist to be confirmed"}
          </p>
          <p className="mt-4 text-body">
            {formatLongDate(appt.date)}
            <br />
            {formatClock(appt.time)}
          </p>
          <p className="mt-4 text-support text-muted">
            Deposit {formatTsh(appt.deposit)} · Total {formatTsh(appt.total)}
          </p>
          <p className="mt-2 text-support text-muted">Ref {appt.id}</p>
        </div>
      )}

      <div className="mt-auto space-y-3 pt-10">
        {needsPay && appt && (
          <Link to="/app/appointments/$id" params={{ id: appt.id }}>
            <Button className="h-13 w-full bg-ink text-white">Pay deposit {formatTsh(appt.deposit)}</Button>
          </Link>
        )}
        <Link to="/app/appointments">
          <Button variant={needsPay ? "secondary" : undefined} className="h-13 w-full">
            View appointments
          </Button>
        </Link>
        <Link to="/app" className="block text-center text-support text-muted">
          Home
        </Link>
        <p className="text-center text-support text-muted">
          Allow notifications so you know when the salon confirms or when it&apos;s time to pay.
        </p>
        <p className="text-center text-support text-muted">{SALON.name}</p>
      </div>
    </main>
  );
}

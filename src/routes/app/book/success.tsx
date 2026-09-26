import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import { formatClock, formatLongDate, formatTsh, paymentLabel } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import { useState } from "react";

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
  const [copied, setCopied] = useState(false);

  function addToCalendar() {
    if (!appt || !service) return;
    const start = `${appt.date.replace(/-/g, "")}T${appt.time.replace(":", "")}00`;
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${service.name} at Salon
DTSTART:${start}
LOCATION:${SALON.addressLine1}, ${SALON.addressLine2}
DESCRIPTION:Booking ${appt.id}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appt.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyRef() {
    if (!appt) return;
    void navigator.clipboard.writeText(appt.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

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
        <h1 className="mt-6 text-title font-normal">You're booked.</h1>
        <p className="mt-2 text-body text-muted">Your appointment has been confirmed.</p>
      </div>

      {service && appt && (
        <div className="mt-10 rounded-[24px] border border-line bg-surface px-5 py-6">
          <p className="text-section font-normal">{service.name}</p>
          <p className="mt-1 text-body text-muted">
            {stylist ? `${stylist.name} · ${stylist.title}` : "Your assigned stylist will be confirmed by the salon."}
          </p>
          <p className="mt-4 text-body">
            {formatLongDate(appt.date)}
            <br />
            {formatClock(appt.time)}
          </p>
        </div>
      )}

      {appt && (
        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-micro uppercase tracking-[0.16em] text-muted">Booking reference</p>
            <p className="mt-1 text-body tabular-nums">{appt.id}</p>
          </div>
          <button type="button" onClick={copyRef} className="text-support">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {appt && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Payment</p>
          <div className="mt-3 flex justify-between text-body">
            <span className="text-muted">Deposit paid</span>
            <span className="tabular-nums">{formatTsh(appt.deposit)}</span>
          </div>
          <div className="mt-2 flex justify-between text-body">
            <span className="text-muted">Remaining</span>
            <span className="tabular-nums">{formatTsh(appt.remaining)}</span>
          </div>
          <p className="mt-2 text-support text-muted">{paymentLabel(appt.paymentMethod)}</p>
        </div>
      )}

      <div className="mt-8">
        <p className="text-micro uppercase tracking-[0.16em] text-muted">What happens next</p>
        <ol className="mt-4 space-y-4">
          {[
            { on: true, label: "Appointment confirmed" },
            { on: false, label: "We'll remind you before your appointment" },
            { on: false, label: "Arrive at the salon at your scheduled time" },
            { on: false, label: "Your stylist will take care of the rest" },
          ].map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={
                  s.on
                    ? "mt-0.5 flex size-5 items-center justify-center rounded-full bg-success text-[10px] text-surface"
                    : "mt-0.5 size-5 rounded-full border border-line"
                }
              >
                {s.on ? "✓" : ""}
              </span>
              <span className={s.on ? "text-body" : "text-body text-muted"}>{s.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {appt && (
          <Link to="/app/appointments/$id" params={{ id: appt.id }} className="block">
            <Button className="h-13 w-full">View appointment</Button>
          </Link>
        )}
        <Button variant="secondary" className="h-12 w-full" onClick={addToCalendar}>
          Add to calendar
        </Button>
        <Link to="/app" className="block text-center text-support text-muted">
          Back to home
        </Link>
      </div>

      <p className="mt-10 text-center text-support text-muted">
        Need help?{" "}
        <a href={SALON.phoneHref} className="text-ink">
          Call salon
        </a>
        {" · "}
        <a href={SALON.whatsapp} className="text-ink">
          WhatsApp
        </a>
      </p>
    </main>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format as formatDate, parseISO } from "date-fns";
import { Check, MoreHorizontal } from "lucide-react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Photo } from "@/components/salon/photo";
import { PayOverlay } from "@/components/salon/pay-overlay";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import {
  TIME_GROUPS,
  displayPhase,
  formatClock,
  formatDurationLong,
  formatLongDate,
  formatShortDate,
  formatTsh,
  nextOpenDays,
  paymentLabel,
  phaseCopy,
} from "@/lib/salon/format";
import { availableSlots } from "@/lib/engines";
import { collectUntilPaid, pollExistingOrder } from "@/lib/payments/collect-client";
import { useSalonStore } from "@/lib/salon/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/appointments/$id")({
  component: AppointmentPage,
});

function AppointmentPage() {
  const { id } = Route.useParams();
  const appt = useSalonStore((s) => s.appointments.find((a) => a.id === id));
  const reschedule = useSalonStore((s) => s.reschedule);
  const cancelAppointment = useSalonStore((s) => s.cancelAppointment);
  const confirmHeld = useSalonStore((s) => s.confirmHeld);
  const attachPaymentOrder = useSalonStore((s) => s.attachPaymentOrder);
  const profile = useSalonStore((s) => s.profile);
  const [more, setMore] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState<"idle" | "waiting" | "confirming">("idle");
  const [payMessage, setPayMessage] = useState("");

  if (!appt) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-title font-normal">Appointment unavailable</p>
        <p className="mt-3 max-w-sm text-body text-muted">
          This appointment may have been cancelled or is no longer available.
        </p>
        <Link to="/app/appointments" className="mt-8">
          <Button className="h-12">Back to appointments</Button>
        </Link>
      </main>
    );
  }

  const service = getService(appt.serviceId);
  const stylist = appt.anyStylist ? null : getStylist(appt.stylistId);
  if (!service) {
    return (
      <main className="px-5 py-16 text-center">
        <p>We couldn't load this appointment.</p>
        <Link to="/app/appointments" className="mt-4 inline-block">
          Back to appointments
        </Link>
      </main>
    );
  }

  const bookingDate = appt.date;
  const bookingTime = appt.time;
  const bookingId = appt.id;
  const serviceName = service.name;

  const phase = displayPhase(appt);
  const copy = phaseCopy(phase, appt.time);
  const d = parseISO(`${appt.date}T${appt.time}:00`);
  const weekday = formatDate(d, "EEE").toUpperCase();
  const dayMonth = formatDate(d, "d MMM").toUpperCase();

  const timeline = timelineFor(phase);
  const primary = primaryAction(phase);

  async function retryPay() {
    if (!appt) return;
    setPayMessage("");
    setPaying("waiting");
    if (appt.paymentOrderId) {
      const existing = await pollExistingOrder(appt.paymentOrderId);
      if (existing.ok) {
        setPaying("confirming");
        confirmHeld(appt.id, existing.orderId);
        setPaying("idle");
        return;
      }
    }
    const result = await collectUntilPaid({
      phone: profile.mpesaPhone || appt.customerPhone,
      amount: appt.deposit || appt.total,
      description: `Salon ${service?.name ?? "booking"} deposit`,
      bookingId: appt.id,
      customerId: appt.customerId,
      customerName: appt.customerName,
      method: appt.paymentMethod,
      kind: "deposit",
    });
    if (result.ok) {
      setPaying("confirming");
      confirmHeld(appt.id, result.orderId);
      setPaying("idle");
      return;
    }
    if (result.orderId) attachPaymentOrder(appt.id, result.orderId);
    setPaying("idle");
    setPayMessage(result.message);
  }

  function addToCalendar() {
    const start = `${bookingDate.replace(/-/g, "")}T${bookingTime.replace(":", "")}00`;
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${serviceName} at Salon
DTSTART:${start}
LOCATION:${SALON.addressLine1}, ${SALON.addressLine2}
DESCRIPTION:Booking ${bookingId}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bookingId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyRef() {
    void navigator.clipboard.writeText(bookingId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const canChange = phase === "confirmed" || phase === "today" || phase === "payment_pending";

  return (
    <main className="mx-auto min-h-dvh max-w-3xl pb-28 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:pt-8">
      <div>
        <header className="flex items-center justify-between px-5 pt-4 lg:px-0 lg:pt-0">
          <Link
            to="/app/appointments"
            aria-label="Back"
            className="flex size-11 items-center justify-center rounded-full"
          >
            ←
          </Link>
          <p className="text-micro uppercase tracking-[0.18em] text-muted">Appointment</p>
          <button
            type="button"
            aria-label="More"
            className="flex size-11 items-center justify-center rounded-full"
            onClick={() => setMore(true)}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="px-5 lg:px-0">
          <div className="relative mt-4 overflow-hidden rounded-[24px]">
            <Photo src={service.image} alt={service.name} className="h-60 w-full lg:h-72" />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full glass-chip px-3 py-1.5 text-support text-ink">
              {phase !== "cancelled" && phase !== "payment_pending" && (
                <span className="text-success">✓</span>
              )}
              {copy.title}
            </span>
          </div>

          <h1 className="mt-5 text-title font-normal">{service.name}</h1>
          <p className="mt-1 text-body text-muted">
            {stylist
              ? `${stylist.name} · ${stylist.title}`
              : "Your assigned stylist will be confirmed by the salon."}
          </p>
          {stylist && <p className="mt-1 text-support text-muted">★ {stylist.rating.toFixed(1)}</p>}
          <p className="mt-4 text-body text-muted">{copy.body}</p>

          <div className="mt-6 rounded-[20px] border border-line bg-surface px-5 py-5">
            <div className="flex items-baseline justify-between">
              <p className="text-micro uppercase tracking-[0.16em] text-muted">{weekday}</p>
              <p className="text-micro uppercase tracking-[0.16em] text-muted">{dayMonth}</p>
            </div>
            <p className="mt-4 text-title font-normal">{formatClock(appt.time)}</p>
            <p className="mt-1 text-support text-muted">
              {service.name} · {formatDurationLong(service.durationMin, service.durationMax)}
            </p>
          </div>

          {phase === "payment_pending" && (
            <div className="mt-6 rounded-[20px] border border-line bg-surface px-5 py-5">
              <p className="text-section font-normal">Complete payment</p>
              <p className="mt-2 text-body text-muted">
                Approve the USSD prompt for {formatTsh(appt.deposit || appt.total)} on{" "}
                {profile.mpesaPhone || appt.customerPhone}.
              </p>
              {payMessage && <p className="mt-3 text-support text-muted">{payMessage}</p>}
              <Button className="mt-4 h-12 w-full" onClick={() => void retryPay()}>
                Pay {formatTsh(appt.deposit || appt.total)}
              </Button>
            </div>
          )}

          {phase === "in_service" && (
            <div className="mt-6">
              <p className="text-section font-normal">Your stylist is ready</p>
              <p className="mt-2 text-body text-muted">
                {stylist ? `${stylist.name} is ready for your appointment.` : "Your appointment is starting now."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 px-5 lg:mt-12 lg:px-0">
        <h2 className="text-support font-medium text-muted">Booking details</h2>
        <dl className="mt-3 space-y-3 text-body">
          <Row label="Service" value={service.name} />
          <Row label="Stylist" value={stylist?.name ?? "To be confirmed"} />
          <Row label="Date" value={formatShortDate(appt.date)} />
          <Row label="Time" value={formatClock(appt.time)} />
          <Row label="Duration" value={formatDurationLong(service.durationMin, service.durationMax)} />
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Booking reference</dt>
            <dd className="tabular-nums">
              {appt.id}{" "}
              <button type="button" className="text-support" onClick={copyRef}>
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        </dl>

        <h2 className="mt-8 text-support font-medium text-muted">Payment</h2>
        <dl className="mt-3 space-y-3 text-body">
          <Row label="Total" value={formatTsh(appt.total)} />
          {appt.remaining > 0 ? (
            <>
              <Row label="Deposit paid" value={formatTsh(appt.deposit)} />
              <Row label="Remaining" value={formatTsh(appt.remaining)} />
            </>
          ) : (
            <div className="flex justify-between">
              <dt className="text-muted">Paid</dt>
              <dd className="inline-flex items-center gap-1.5 tabular-nums">
                <span className="text-success">✓</span>
                {formatTsh(appt.deposit)}
              </dd>
            </div>
          )}
          <Row label="Payment method" value={paymentLabel(appt.paymentMethod)} />
        </dl>

        {(appt.style || appt.notes || appt.sensitivities.length > 0 || appt.photoData) && (
          <>
            <h2 className="mt-8 text-support font-medium text-muted">Your preferences</h2>
            {appt.style && (
              <div className="mt-3">
                <p className="text-support text-muted">Preferred style</p>
                <p className="text-body">{appt.style}</p>
              </div>
            )}
            {(appt.notes || appt.sensitivities.length > 0) && (
              <div className="mt-3">
                <p className="text-support text-muted">Notes</p>
                <p className="text-body">
                  {[...appt.sensitivities, appt.notes].filter(Boolean).join(". ")}
                </p>
              </div>
            )}
            {appt.photoData && (
              <div className="mt-3">
                <p className="text-support text-muted">Reference photo</p>
                <img src={appt.photoData} alt="Reference" className="mt-2 h-24 w-20 rounded-xl object-cover" />
              </div>
            )}
          </>
        )}

        <h2 className="mt-8 text-support font-medium text-muted">What happens next</h2>
        <ol className="mt-4">
          {timeline.map((item, i) => (
            <li key={item.label} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px]",
                    item.state === "done" && "bg-success text-surface",
                    item.state === "now" && "border-2 border-ink",
                    item.state === "todo" && "border border-line",
                  )}
                >
                  {item.state === "done" ? <Check className="size-3" strokeWidth={2.4} /> : null}
                </span>
                {i < timeline.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
              </span>
              <span className={cn("pb-5 text-body", item.state === "todo" && "text-muted")}>{item.label}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-2 text-support font-medium text-muted">Salon</h2>
        <p className="mt-3 text-body">{SALON.name}</p>
        <p className="text-support text-muted">
          {SALON.addressLine1}
          <br />
          {SALON.addressLine2}
          <br />
          {SALON.hours}
        </p>
        <a
          href={SALON.mapsApp}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block overflow-hidden rounded-[20px] border border-line"
        >
          <iframe title="Map preview" src={SALON.mapEmbed} className="pointer-events-none h-32 w-full grayscale" />
          <div className="flex items-center justify-between px-4 py-3 text-support">
            <span>
              {SALON.addressLine1}
              <br />
              {SALON.addressLine2}
            </span>
            <span>Get directions →</span>
          </div>
        </a>
        <div className="mt-4 flex gap-2">
          <a href={SALON.phoneHref} className="flex-1">
            <Button variant="secondary" className="h-12 w-full" size="md">
              Call salon
            </Button>
          </a>
          <a href={SALON.whatsapp} className="flex-1">
            <Button variant="secondary" className="h-12 w-full" size="md">
              WhatsApp
            </Button>
          </a>
        </div>

        {canChange && (
          <div className="mt-8 space-y-3">
            <button type="button" className="block w-full text-left text-body" onClick={() => setRescheduleOpen(true)}>
              Reschedule
            </button>
            <button type="button" className="block w-full text-left text-body text-danger" onClick={() => setCancelOpen(true)}>
              Cancel appointment
            </button>
          </div>
        )}
        {phase === "completed" && (
          <div className="mt-8 flex flex-col gap-3">
            <ReviewForm appointmentId={appt.id} />
            <Link to="/app/book" search={{ service: service.id }}>
              <Button className="h-13 w-full">Book again</Button>
            </Link>
          </div>
        )}
      </div>

      {primary && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line glass-bar px-5 py-4 lg:hidden">
          {primary === "pay" && (
            <Button className="h-13 w-full" onClick={() => void retryPay()}>
              Pay {formatTsh(appt.deposit || appt.total)}
            </Button>
          )}
          {primary === "calendar" && (
            <Button className="h-13 w-full" onClick={addToCalendar}>
              Add to Calendar
            </Button>
          )}
          {primary === "directions" && (
            <a href={SALON.mapsApp} target="_blank" rel="noreferrer" className="block">
              <Button className="h-13 w-full">Get Directions</Button>
            </a>
          )}
          {primary === "review" && (
            <Button className="h-13 w-full" onClick={() => document.getElementById("leave-review")?.scrollIntoView({ behavior: "smooth" })}>
              Leave a Review
            </Button>
          )}
          {primary === "contact" && (
            <a href={SALON.whatsapp} className="block">
              <Button className="h-13 w-full">Contact salon</Button>
            </a>
          )}
        </div>
      )}

      {paying !== "idle" && (
        <PayOverlay
          phase={paying}
          phone={profile.mpesaPhone || appt.customerPhone}
          amount={appt.deposit || appt.total}
        />
      )}

      <Drawer.Root open={more} onOpenChange={setMore}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-surface px-6 pb-10 pt-4">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
            <Drawer.Title className="text-section font-normal">Appointment options</Drawer.Title>
            <ul className="mt-4">
              {canChange && (
                <li>
                  <button
                    type="button"
                    className="w-full py-4 text-left text-body"
                    onClick={() => {
                      setMore(false);
                      setRescheduleOpen(true);
                    }}
                  >
                    Reschedule appointment
                  </button>
                </li>
              )}
              {canChange && (
                <li>
                  <button
                    type="button"
                    className="w-full py-4 text-left text-body text-danger"
                    onClick={() => {
                      setMore(false);
                      setCancelOpen(true);
                    }}
                  >
                    Cancel appointment
                  </button>
                </li>
              )}
              <li>
                <a href={SALON.whatsapp} className="block py-4 text-body">
                  Contact salon
                </a>
              </li>
              <li>
                <a href={SALON.whatsapp} className="block py-4 text-body">
                  Report a problem
                </a>
              </li>
            </ul>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <RescheduleSheet
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        stylistId={appt.stylistId}
        currentDate={appt.date}
        currentTime={appt.time}
        onConfirm={(date, time) => {
          reschedule(appt.id, date, time);
          setRescheduleOpen(false);
        }}
      />

      <Drawer.Root open={cancelOpen} onOpenChange={setCancelOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-surface px-6 pb-10 pt-4">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
            <Drawer.Title className="text-title font-normal">Cancel appointment?</Drawer.Title>
            <p className="mt-3 text-body">
              {service.name}
              <br />
              {formatShortDate(appt.date)} · {formatClock(appt.time)}
            </p>
            <p className="mt-5 text-support font-medium">Cancellation policy</p>
            <p className="mt-2 text-support text-muted">{SALON.cancellationPolicy}</p>
            <Button className="mt-8 h-13 w-full" onClick={() => setCancelOpen(false)}>
              Keep appointment
            </Button>
            <button
              type="button"
              className="mt-4 w-full text-center text-body text-danger"
              onClick={() => {
                cancelAppointment(appt.id);
                setCancelOpen(false);
              }}
            >
              Cancel appointment
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  );
}

function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const existing = useSalonStore((s) => s.reviews.find((r) => r.appointmentId === appointmentId));
  const submitReview = useSalonStore((s) => s.submitReview);
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  if (existing) {
    return (
      <div id="leave-review" className="rounded-[24px] bg-surface p-5">
        <p className="text-body font-medium">You rated this visit {existing.rating}/5</p>
        <p className="mt-2 text-body text-muted">{existing.quote}</p>
      </div>
    );
  }
  return (
    <form
      id="leave-review"
      className="rounded-[24px] bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submitReview({ appointmentId, rating, quote: quote.trim() || "Beautiful work." });
      }}
    >
      <p className="text-section font-normal">How was your visit?</p>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={cn("size-11 rounded-full border text-body", n <= rating ? "border-ink bg-ink text-white" : "border-line")}
          >
            {n}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-4"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Tell us what you loved..."
      />
      <Button type="submit" className="mt-4 h-12 w-full">
        Submit review
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function timelineFor(phase: ReturnType<typeof displayPhase>) {
  const steps = [
    { key: "confirmed", label: "Appointment confirmed" },
    { key: "reminder", label: "Reminder sent before your appointment" },
    { key: "arrive", label: "Arrive at Salon" },
    { key: "service", label: "Your stylist takes care of the rest" },
  ];
  const idx =
    phase === "cancelled"
      ? -1
      : phase === "payment_pending"
        ? 0
        : phase === "confirmed"
          ? 1
          : phase === "today"
            ? 2
            : phase === "checked_in"
              ? 3
              : 4;
  return steps.map((s, i) => ({
    label: s.label,
    state: (idx > i ? "done" : idx === i ? "now" : "todo") as "done" | "now" | "todo",
  }));
}

function primaryAction(phase: ReturnType<typeof displayPhase>) {
  if (phase === "payment_pending") return "pay" as const;
  if (phase === "confirmed") return "calendar" as const;
  if (phase === "today" || phase === "checked_in") return "directions" as const;
  if (phase === "in_service") return "contact" as const;
  if (phase === "completed") return "review" as const;
  return null;
}

function RescheduleSheet({
  open,
  onOpenChange,
  stylistId,
  currentDate,
  currentTime: _currentTime,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stylistId: string;
  currentDate: string;
  currentTime: string;
  onConfirm: (date: string, time: string) => void;
}) {
  const appointments = useSalonStore((s) => s.appointments);
  const timeOff = useSalonStore((s) => s.timeOff);
  const serviceId = useSalonStore((s) => s.appointments.find((a) => a.date === currentDate)?.serviceId ?? "hair-braiding");
  const days = useMemo(() => nextOpenDays(14), []);
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const openTimes = availableSlots({ date, stylistId, serviceId, appointments, timeOff, ignoreId: undefined });
  const unavailable = new Set(TIME_GROUPS.flatMap((g) => g.slots).filter((t) => !openTimes.includes(t)));

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setConfirming(false);
          setTime(null);
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl bg-surface px-6 pb-10 pt-4">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
          <Drawer.Title className="text-title font-normal">Reschedule appointment</Drawer.Title>
          {!confirming ? (
            <>
              <p className="mt-6 text-support font-medium text-muted">Choose a new date</p>
              <div className="mt-3 flex gap-2 overflow-x-auto hide-scroll pb-2">
                {days.map((d) => {
                  const key = formatDate(d, "yyyy-MM-dd");
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setDate(key);
                        setTime(null);
                      }}
                      className={cn(
                        "flex h-20 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border",
                        date === key ? "border-ink bg-ink text-white" : "border-line",
                      )}
                    >
                      <span className="text-micro uppercase">{formatDate(d, "EEE")}</span>
                      <span className="mt-1 text-body tabular-nums">{formatDate(d, "d")}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-support font-medium text-muted">Available times</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {TIME_GROUPS.flatMap((g) => g.slots).map((t) => {
                  const disabled = unavailable.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTime(t)}
                      className={cn(
                        "h-11 rounded-xl border text-support tabular-nums",
                        disabled && "border-transparent text-muted/35",
                        !disabled && time === t && "border-ink bg-ink text-white",
                        !disabled && time !== t && "border-line",
                      )}
                    >
                      {formatClock(t)}
                    </button>
                  );
                })}
              </div>
              <Button className="mt-8 h-13 w-full" disabled={!time} onClick={() => setConfirming(true)}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <p className="mt-4 text-body">
                Change your appointment to
                <br />
                <span className="font-medium">
                  {formatLongDate(date)} at {time ? formatClock(time) : ""}?
                </span>
              </p>
              <Button
                className="mt-8 h-13 w-full"
                onClick={() => {
                  if (time) onConfirm(date, time);
                }}
              >
                Confirm change
              </Button>
              <button type="button" className="mt-4 w-full text-center text-body" onClick={() => onOpenChange(false)}>
                Keep appointment
              </button>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

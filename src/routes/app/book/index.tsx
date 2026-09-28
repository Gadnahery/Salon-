import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format as formatDate, isToday, isTomorrow } from "date-fns";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ScreenHeader } from "@/components/salon/screen-header";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { Photo } from "@/components/salon/photo";
import { getService, getStylist, SALON, services, stylists, stylistsFor } from "@/lib/salon/data";
import {
  TIME_GROUPS,
  TIME_SLOTS,
  formatClock,
  formatDuration,
  formatLongDate,
  formatTsh,
  nextOpenDays,
  paymentLabel,
  SENSITIVITY_OPTIONS,
  toLocalTzPhone,
  isValidLocalTzPhone,
  displayLocalPhone,
  customerIdFromPhone,
} from "@/lib/salon/format";
import { availableSlots, dateHasRealAvailability, quote } from "@/lib/engines";
import { useSalonStore } from "@/lib/salon/store";
import type { Category, PaymentMethod } from "@/lib/salon/types";
import { cn, wait } from "@/lib/utils";
import { collectUntilPaid } from "@/lib/payments/collect-client";
import { PayOverlay } from "@/components/salon/pay-overlay";

type Search = { service?: string; category?: Category };

export const Route = createFileRoute("/app/book/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    service: typeof s.service === "string" ? s.service : undefined,
    category: typeof s.category === "string" ? (s.category as Category) : undefined,
  }),
  component: BookPage,
});

const STEP_TITLES = [
  "Choose your stylist",
  "Choose a date",
  "Choose a time",
  "Your details",
  "Review & pay",
];

function BookPage() {
  const { service: serviceParam, category } = Route.useSearch();
  const draft = useSalonStore((s) => s.draft);
  const offers = useSalonStore((s) => s.offers);
  const setDraft = useSalonStore((s) => s.setDraft);
  const confirm = useSalonStore((s) => s.confirmBooking);
  const holdBooking = useSalonStore((s) => s.holdBooking);
  const confirmHeld = useSalonStore((s) => s.confirmHeld);
  const expireHeld = useSalonStore((s) => s.expireHeld);
  const attachPaymentOrder = useSalonStore((s) => s.attachPaymentOrder);
  const profile = useSalonStore((s) => s.profile);
  const setProfile = useSalonStore((s) => s.setProfile);
  const enterAs = useSalonStore((s) => s.enterAs);
  const session = useSalonStore((s) => s.session);
  const appointments = useSalonStore((s) => s.appointments);
  const joinWaitlist = useSalonStore((s) => s.joinWaitlist);
  const [waitListed, setWaitListed] = useState(false);
  const timeOff = useSalonStore((s) => s.timeOff);
  const catalog = useSalonStore((s) => s.catalog);
  const settings = useSalonStore((s) => s.settings);
  const navigate = useNavigate();
  const [needService, setNeedService] = useState(!serviceParam);
  const [step, setStep] = useState(0);
  const [paying, setPaying] = useState<"idle" | "sending" | "waiting" | "confirming">("idle");
  const [payError, setPayError] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const payAbortRef = useRef<AbortController | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    if (serviceParam) {
      setDraft({ serviceId: serviceParam });
      setNeedService(false);
      setStep(0);
    } else {
      // Fresh book from landing/menu: pick a service first (ignore stale draft)
      setNeedService(true);
      setStep(0);
    }
  }, [serviceParam, setDraft]);

  const serviceList = catalog.length ? catalog : services;
  const service = draft.serviceId ? getService(draft.serviceId) : undefined;
  const days = useMemo(() => nextOpenDays(14), []);
  const openTimes = useMemo(() => {
    if (!draft.date || !draft.serviceId) return [] as string[];
    return availableSlots({
      date: draft.date,
      stylistId: draft.stylistId,
      serviceId: draft.serviceId,
      appointments,
      timeOff,
    });
  }, [draft.date, draft.stylistId, draft.serviceId, appointments, timeOff]);
  const unavailable = new Set(TIME_SLOTS.filter((t) => !openTimes.includes(t)));
  const people = service ? stylistsFor(service.category) : stylists;
  const listed = category ? serviceList.filter((s) => s.category === category) : serviceList;

  const priced = service ? quote(service.id, { offers }) : { total: 0, deposit: 0, remaining: 0, discount: 0, offer: null, base: 0 };
  const { total, deposit, remaining } = priced;

  function go(next: number) {
    setStep(next);
  }

  function back() {
    if (needService) {
      history.back();
      return;
    }
    if (step === 0) {
      if (!serviceParam) {
        setNeedService(true);
        return;
      }
      history.back();
      return;
    }
    go(step - 1);
  }

  function submitRequest() {
    if (!service) return;
    const phone = toLocalTzPhone(profile.mpesaPhone || profile.phone);
    if (!isValidLocalTzPhone(phone)) {
      setPayError(true);
      setPayMessage("Enter a phone like 07XXXXXXXX.");
      return;
    }
    setProfile({ phone, mpesaPhone: phone });
    const sid = customerIdFromPhone(phone);
    if (session.portal === "customer" && session.actorId !== sid) {
      enterAs({ ...session, actorId: sid, name: profile.name || session.name });
    }
    const held = holdBooking();
    if (!held) {
      setPayError(true);
      setPayMessage("We couldn't hold this time. Choose another slot.");
      return;
    }
    void navigate({ to: "/app/book/success", search: { id: held.id } });
  }

  async function pay() {
    if (!service) return;
    if (paying !== "idle") return; // hard block double tap
    setPayError(false);
    setPayMessage("");
    setPaying("sending");
    payAbortRef.current?.abort();
    const ac = new AbortController();
    payAbortRef.current = ac;

    const phone = toLocalTzPhone(profile.mpesaPhone || profile.phone);
    if (!isValidLocalTzPhone(phone)) {
      setPaying("idle");
      setPayError(true);
      setPayMessage("Enter a phone like 07XXXXXXXX before paying.");
      return;
    }
    setProfile({ phone, mpesaPhone: phone });
    // Keep session bound to phone identity
    const sid = customerIdFromPhone(phone);
    if (session.portal === "customer" && session.actorId !== sid) {
      enterAs({ ...session, actorId: sid, name: profile.name || session.name });
    }

    // If we already sent USSD for a held booking, only check status — never second push
    const held = holdBooking();
    if (!held) {
      setPaying("idle");
      setPayError(true);
      setPayMessage("We couldn't hold this time. Choose another slot.");
      return;
    }
    const existing =
      pendingOrderId ||
      held.paymentOrderId ||
      undefined;

    const result = await collectUntilPaid({
      phone,
      amount: deposit,
      description: `Salon ${service.name} deposit`,
      bookingId: held.id,
      customerId: held.customerId,
      customerName: held.customerName,
      method: draft.paymentMethod,
      kind: "deposit",
      existingOrderId: existing,
      signal: ac.signal,
      onPromptSent: (orderId) => {
        setPendingOrderId(orderId);
        attachPaymentOrder(held.id, orderId);
        setPaying("waiting");
      },
    });
    if (result.ok) {
      setPendingOrderId(null);
      setPaying("confirming");
      await wait(400);
      const appt = confirmHeld(held.id, result.orderId);
      if (appt) {
        void navigate({ to: "/app/book/success", search: { id: appt.id } });
        return;
      }
      setPayMessage("Payment went through, but we couldn't confirm the booking. Open Appointments to finish.");
      setPaying("idle");
      setPayError(true);
      return;
    }
    if (result.orderId) {
      attachPaymentOrder(held.id, result.orderId);
    } else {
      expireHeld(held.id);
    }
    setPayMessage(result.message);
    setPaying("idle");
    setPayError(true);
  }

  const hasCustomerCreds =
    profile.name.trim().length >= 2 && isValidLocalTzPhone(profile.phone);

  const canContinue = needService
    ? !!draft.serviceId
    : (step === 0 && !!draft.stylistId) ||
      (step === 1 && !!draft.date) ||
      (step === 2 && !!draft.time) ||
      (step === 3 && hasCustomerCreds) ||
      (step === 4 && hasCustomerCreds);

  const heading = needService
    ? "Which service?"
    : step === 0
      ? "Who would you like?"
      : step === 1
        ? "When would you like to come?"
        : step === 2
          ? "Pick a time."
          : step === 3
            ? "Anything we should know?"
            : "Almost there.";

  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-bg pb-32">
      <ScreenHeader title={service?.name ?? "Book"} />
      {!needService && (
        <div className="px-5">
          <div className="flex items-center gap-2">
            {STEP_TITLES.map((_, i) => (
              <span
                key={i}
                className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-ink" : "bg-line")}
              />
            ))}
          </div>
          <p className="mt-3 text-support text-muted">{STEP_TITLES[step]}</p>
        </div>
      )}

      <div
        key={needService ? "svc" : step}
        className="mt-6 px-5 animate-fade-up"
        style={{ animationDuration: "280ms" }}
      >
        <h1 className="text-title font-normal">{heading}</h1>
        {needService && (
          <ul className="mt-6 space-y-2">
            {listed.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setDraft({ serviceId: s.id, stylistId: "any" })}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-[20px] border px-3 py-3 text-left",
                    draft.serviceId === s.id ? "border-ink bg-brand-soft" : "border-line bg-surface",
                  )}
                >
                  <Photo src={s.image} alt="" className="size-16 rounded-2xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-medium">{s.name}</span>
                    <span className="block text-support text-muted">{formatTsh(s.priceMin)}</span>
                  </span>
                  {draft.serviceId === s.id && <Check className="size-4" strokeWidth={1.75} />}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!needService && step === 0 && (
          <div>
            <p className="mt-2 text-body text-muted">
              Choose a stylist or let us find the best available person for you.
            </p>
            <button
              type="button"
              onClick={() => setDraft({ stylistId: "any" })}
              className={cn(
                "mt-6 flex w-full items-center justify-between rounded-[20px] border px-5 py-5 text-left",
                draft.stylistId === "any" ? "border-ink bg-brand-soft" : "border-line bg-surface",
              )}
            >
              <span>
                <span className="block text-body font-medium">Any available</span>
                <span className="mt-1 block text-support text-muted">We'll match you with a qualified stylist.</span>
              </span>
              {draft.stylistId === "any" && <Check className="size-4" strokeWidth={1.75} />}
            </button>
            <ul className="mt-3 space-y-2">
              {people.map((st) => (
                <li key={st.id}>
                  <button
                    type="button"
                    onClick={() => setDraft({ stylistId: st.id })}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-[20px] border px-4 py-4 text-left",
                      draft.stylistId === st.id ? "border-ink bg-brand-soft" : "border-line bg-surface",
                    )}
                  >
                    <StylistAvatar stylist={st} selected={draft.stylistId === st.id} />
                    <span className="flex-1">
                      <span className="block text-body font-medium">{st.name}</span>
                      <span className="block text-support text-muted">{st.title}</span>
                      <span className="block text-support text-muted">★ {st.rating.toFixed(1)}</span>
                    </span>
                    {draft.stylistId === st.id && <Check className="size-4" strokeWidth={1.75} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!needService && step === 1 && (
          <div>
            <div className="mt-6 flex gap-2 overflow-x-auto hide-scroll pb-2">
              {days.map((d) => {
                const key = formatDate(d, "yyyy-MM-dd");
                const selected = draft.date === key;
                const open = draft.serviceId
                  ? dateHasRealAvailability(key, draft.stylistId, draft.serviceId, appointments, timeOff)
                  : false;
                const label = isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : formatDate(d, "EEE");
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!open}
                    onClick={() => setDraft({ date: key, time: null })}
                    className={cn(
                      "flex h-24 w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-[20px] border",
                      !open && "border-transparent bg-bg text-muted/40",
                      open && selected && "border-ink bg-ink text-white",
                      open && !selected && "border-line bg-surface text-ink",
                    )}
                  >
                    <span className="text-micro uppercase tracking-[0.12em] opacity-70">{label}</span>
                    <span className="mt-1 text-section tabular-nums">{formatDate(d, "d")}</span>
                    <span className="mt-1 text-[10px]">{open ? "●" : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!needService && step === 2 && (
          <div>
            {draft.date && (
              <p className="mt-2 text-body text-muted">Available times for {formatLongDate(draft.date)}</p>
            )}
            {openTimes.length === 0 ? (
              <div className="mt-10 text-center">
                <p className="text-section font-normal">No times available</p>
                <p className="mt-2 text-body text-muted">
                  There aren't any openings for this date with your selected stylist.
                </p>
                <Button className="mt-6 h-12" onClick={() => go(1)}>
                  Choose another date
                </Button>
                {draft.stylistId !== "any" && (
                  <Button
                    variant="secondary"
                    className="mt-3 h-12"
                    onClick={() => {
                      setDraft({ stylistId: "any", time: null });
                    }}
                  >
                    Try any available stylist
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="mt-3 h-12"
                  disabled={waitListed || !draft.serviceId || !draft.date}
                  onClick={() => {
                    if (!draft.serviceId || !draft.date) return;
                    joinWaitlist({
                      serviceId: draft.serviceId,
                      stylistId: draft.stylistId,
                      preferredDate: draft.date,
                      customerId: session.actorId,
                      customerName: profile.name || session.name,
                      customerPhone: profile.phone,
                    });
                    setWaitListed(true);
                  }}
                >
                  {waitListed ? "You're on the waitlist" : "Join waitlist for this day"}
                </Button>
              </div>
            ) : (
              TIME_GROUPS.map((group) => (
                <div key={group.label} className="mt-7">
                  <p className="text-support font-medium text-muted">{group.label}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {group.slots.map((t) => {
                      const disabled = unavailable.has(t);
                      const selected = draft.time === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={disabled}
                          onClick={() => setDraft({ time: t })}
                          className={cn(
                            "h-12 rounded-2xl border text-support tabular-nums",
                            disabled && "cursor-not-allowed border-transparent bg-transparent text-muted/35",
                            !disabled && selected && "border-ink bg-ink text-white",
                            !disabled && !selected && "border-line bg-surface text-ink",
                          )}
                        >
                          {formatClock(t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!needService && step === 3 && service && (
          <div className="mt-6 space-y-6">
            {service.acceptsReference && (
              <div>
                <Label htmlFor="style">Preferred style</Label>
                <Input
                  id="style"
                  value={draft.style}
                  onChange={(e) => setDraft({ style: e.target.value })}
                  placeholder="e.g. Knotless braids, medium size..."
                />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(e) => setDraft({ notes: e.target.value })}
                placeholder="Anything you'd like your stylist to know?"
              />
            </div>
            {(service.category === "hair" || service.category === "treatments") && (
              <div>
                <p className="mb-3 text-support font-medium text-muted">Anything we should be aware of?</p>
                <div className="flex flex-wrap gap-2">
                  {SENSITIVITY_OPTIONS.map((opt) => {
                    const on = draft.sensitivities.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setDraft({
                            sensitivities: on
                              ? draft.sensitivities.filter((x) => x !== opt)
                              : [...draft.sensitivities, opt],
                          })
                        }
                        className={cn(
                          "h-10 rounded-full px-4 text-support",
                          on ? "bg-ink text-white" : "border border-line bg-surface text-ink",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {service.acceptsReference && (
              <div>
                <p className="text-support font-medium text-muted">Add a reference photo</p>
                <p className="mt-1 text-support text-muted">Show us what you're going for. JPG / PNG · up to 10 MB</p>
                <label className="mt-3 flex h-28 cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-line bg-surface text-support text-muted">
                  {draft.photoName ? draft.photoName : "+ Add photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        setDraft({ photoName: file.name, photoData: String(reader.result ?? "") });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            )}
            <div className="rounded-[24px] border border-line bg-surface p-5">
              <p className="text-body font-medium">Your details</p>
              <p className="mt-1 text-support text-muted">
                Required before payment. Existing customers: enter the same name and phone you used before.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="book-name">Full name</Label>
                  <Input
                    id="book-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="book-phone">Phone number</Label>
                  <Input
                    id="book-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9+\s]/g, "");
                      setProfile({ phone: v, mpesaPhone: v });
                    }}
                    onBlur={() => {
                      const v = toLocalTzPhone(profile.phone);
                      if (v) setProfile({ phone: v, mpesaPhone: v });
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="07XXXXXXXX"
                    required
                  />
                </div>
              </div>
              <p className="mt-3 text-support text-muted">
                Already signed in?{" "}
                <a href="/enter?as=customer" className="text-ink underline-offset-2 hover:underline">
                  Open customer sign in
                </a>
              </p>
            </div>
          </div>
        )}

        {!needService && step === 4 && service && (
          <div className="mt-6">
            <div className="overflow-hidden rounded-[24px] bg-surface">
              <Photo src={service.image} alt="" className="h-40 w-full" />
              <div className="p-5">
                <p className="text-section font-normal">{service.name}</p>
                <p className="mt-1 text-body text-muted">
                  {draft.stylistId === "any"
                    ? "Any available stylist"
                    : `${getStylist(draft.stylistId)?.name} · ${getStylist(draft.stylistId)?.title ?? ""}`}
                </p>
                {draft.date && draft.time && (
                  <p className="mt-3 text-body">
                    {formatLongDate(draft.date)}
                    <br />
                    {formatClock(draft.time)} · {formatDuration(service.durationMin, service.durationMax)}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-line pt-5 text-body">
              <div className="flex justify-between">
                <dt className="text-muted">Service</dt>
                <dd className="tabular-nums">{formatTsh(priced.base ?? total)}</dd>
              </div>
              {priced.discount ? (
                <div className="flex justify-between text-success">
                  <dt>{priced.offer?.title ?? "Offer"} (−{priced.offer?.discountPercent ?? 0}%)</dt>
                  <dd className="tabular-nums">−{formatTsh(priced.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">Deposit</dt>
                <dd className="tabular-nums">{formatTsh(deposit)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Due today</dt>
                <dd className="tabular-nums">{formatTsh(deposit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Remaining</dt>
                <dd className="tabular-nums">{formatTsh(remaining)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className="text-support font-medium text-muted">Cancellation policy</p>
              <p className="mt-2 text-support text-muted">{SALON.cancellationPolicy}</p>
              <button type="button" className="mt-2 text-support" onClick={() => setPolicyOpen(!policyOpen)}>
                {policyOpen ? "Hide policy" : "View full policy →"}
              </button>
            </div>

            <p className="mt-8 text-body font-medium">Next steps</p>
            <p className="mt-2 text-support text-muted">
              1) Send this request. 2) Wait for the salon to accept. 3) Then pay the deposit on your phone. You do not pay until they accept.
            </p>
            {payError && (
              <div className="mt-5 rounded-2xl border border-brand/30 bg-brand-soft p-4">
                <p className="text-body font-medium text-brand">Payment problem</p>
                <p className="mt-1 text-support text-ink">
                  {payMessage ||
                    "Your appointment hasn&apos;t been confirmed. Check the USSD prompt on your phone, then try again."}
                </p>
                <Button
                  type="button"
                  className="mt-4 h-11 w-full bg-ink text-white"
                  onClick={() => {
                    setPayError(false);
                    setPayMessage("");
                    void pay();
                  }}
                >
                  {pendingOrderId ? "Check payment status" : "Try payment again"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line glass-bar px-5 py-4">
        <div className="mx-auto max-w-3xl">
          {needService || step < 4 ? (
            <Button
              className="h-13 w-full bg-ink text-white"
              disabled={!canContinue}
              onClick={() => {
                if (needService) {
                  setNeedService(false);
                  setStep(0);
                  return;
                }
                go(step + 1);
              }}
            >
              {needService
                ? "Continue"
                : step === 3
                  ? "Review appointment"
                  : "Continue"}
            </Button>
          ) : (
            <Button
              className="h-13 w-full bg-ink text-white"
              disabled={!canContinue}
              onClick={() => submitRequest()}
            >
              Request appointment
            </Button>
          )}
          <button type="button" onClick={back} className="mt-3 w-full text-center text-support text-muted">
            Back
          </button>
        </div>
      </div>

      {paying !== "idle" && (
        <PayOverlay
          phase={paying}
          phone={profile.mpesaPhone || profile.phone}
          amount={deposit}
          onCancel={() => {
            payAbortRef.current?.abort();
            setPaying("idle");
            setPayError(true);
            setPayMessage(
              pendingOrderId
                ? "Cancelled waiting. Decline any open USSD on your phone. Tap Try again only checks status — it will not send a new charge."
                : "Cancelled before USSD was sent.",
            );
          }}
        />
      )}
    </main>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ScreenHeader } from "@/components/salon/screen-header";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { PayOverlay } from "@/components/salon/pay-overlay";
import { categoryOrder, formatDuration, formatTsh, paymentLabel } from "@/lib/salon/format";
import { categoryLabel } from "@/lib/salon/format";
import { toLocalTzPhone, isValidLocalTzPhone } from "@/lib/salon/format";
import { stylistsOnTeam } from "@/lib/salon/data";
import { quote } from "@/lib/engines";
import { collectUntilPaid } from "@/lib/payments/collect-client";
import { effectiveShift, useSalonStore } from "@/lib/salon/store";
import type { Category, PaymentMethod } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/walk-in")({ component: WalkInPage });

function WalkInPage() {
  const customers = useSalonStore((s) => s.customers);
  const appointments = useSalonStore((s) => s.appointments);
  const staffStatus = useSalonStore((s) => s.staffStatus);
  const addWalkIn = useSalonStore((s) => s.addWalkIn);
  const catalog = useSalonStore((s) => s.catalog);
  const queue = useSalonStore((s) => s.queue);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>();
  const [found, setFound] = useState("");
  const [category, setCategory] = useState<Category>("hair");
  const [serviceId, setServiceId] = useState<string>("");
  const [stylistId, setStylistId] = useState("any");
  const [payment, setPayment] = useState<"deposit" | "now" | "later">("later");
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [doneId, setDoneId] = useState<string | null>(null);
  const [paying, setPaying] = useState<"idle" | "sending" | "waiting" | "confirming">("idle");
  const [payMessage, setPayMessage] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const payAbortRef = useRef<AbortController | null>(null);

  const digits = phone.replace(/\D/g, "");
  const listed = catalog.filter((s) => s.category === category);
  const service = catalog.find((s) => s.id === serviceId);
  const team = stylistsOnTeam();

  const position = useMemo(() => queue.filter((q) => q.status === "waiting").length + 1, [queue]);

  function search() {
    const hit = customers.find((c) => c.phone.replace(/\D/g, "").endsWith(digits.slice(-9)));
    if (hit) {
      setName(hit.name);
      setCustomerId(hit.id);
      setFound(`${hit.name} found`);
    } else {
      setFound("");
      setCustomerId(undefined);
    }
  }

  async function submit() {
    const priced = service ? quote(service.id) : { total: 0, deposit: 0, remaining: 0 };
    const amount = payment === "now" ? priced.total : payment === "deposit" ? priced.deposit : 0;
    const appt = addWalkIn({
      customerId,
      name: name.trim(),
      phone: phone.trim(),
      serviceId,
      stylistId,
      payment,
      method,
    });
    if (!appt) return;
    if (amount > 0) {
      setPaying("sending");
      payAbortRef.current?.abort();
      const ac = new AbortController();
      payAbortRef.current = ac;
      const localPhone = toLocalTzPhone(phone);
      if (!isValidLocalTzPhone(localPhone)) {
        setPaying("idle");
        setPayMessage("Use a phone like 07XXXXXXXX.");
        return;
      }
      const result = await collectUntilPaid({
        phone: localPhone,
        amount,
        description: `Salon walk-in ${appt.id}`,
        bookingId: appt.id,
        customerId: appt.customerId,
        customerName: appt.customerName,
        method,
        kind: payment === "now" ? "full" : "deposit",
        existingOrderId: pendingOrderId || undefined,
        signal: ac.signal,
        onPromptSent: (oid) => {
          setPendingOrderId(oid);
          setPaying("waiting");
        },
      });
      if (!result.ok) {
        setPaying("idle");
        setPayMessage(result.message);
        setDoneId(appt.id);
        return;
      }
      setPaying("confirming");
    }
    setDoneId(appt.id);
  }

  if (doneId) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg">
        <ScreenHeader title="Walk-in" backTo="/staff/queue" />
        <div className="px-5 pt-8">
          <p className="text-title font-normal">Added successfully</p>
          <p className="mt-3 text-body text-muted">
            {name} has been added to today’s queue. Position {String(position).padStart(2, "0")}.
          </p>
          <Button className="mt-8 h-12 w-full" onClick={() => void navigate({ to: "/staff/queue" })}>
            Open queue
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-28">
      <ScreenHeader title="New walk-in" />
      <div className="flex gap-2 px-5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-ink" : "bg-line")} />
        ))}
      </div>

      <div className="mt-6 px-5">
        {step === 0 && (
          <>
            <p className="text-section font-normal">Customer</p>
            <Label className="mt-6">Customer phone</Label>
            <Input
              inputMode="tel"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button variant="secondary" className="mt-3 h-12 w-full" onClick={search} disabled={digits.length < 9}>
              Search customer
            </Button>
            {found && <p className="mt-3 text-body">{found}</p>}
            <Label className="mt-6">Customer name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-section font-normal">Choose service</p>
            <div className="mt-5 flex gap-2 overflow-x-auto hide-scroll">
              {categoryOrder.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setServiceId("");
                  }}
                  className={cn(
                    "h-10 shrink-0 rounded-full px-4 text-support",
                    category === c ? "bg-ink text-white" : "border border-line",
                  )}
                >
                  {categoryLabel(c)}
                </button>
              ))}
            </div>
            <ul className="mt-5 space-y-2">
              {listed.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={cn(
                      "w-full rounded-[20px] border px-4 py-4 text-left",
                      serviceId === s.id ? "border-ink bg-brand-soft" : "border-line bg-surface",
                    )}
                  >
                    <p className="text-body font-medium">{s.name}</p>
                    <p className="mt-1 text-support text-muted">
                      {formatTsh(s.priceMin)}
                      {s.priceMax ? `–${formatTsh(s.priceMax)}` : ""} · {formatDuration(s.durationMin, s.durationMax)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-section font-normal">Assign stylist</p>
            <button
              type="button"
              onClick={() => setStylistId("any")}
              className={cn(
                "mt-5 w-full rounded-[20px] border px-4 py-4 text-left",
                stylistId === "any" ? "border-ink bg-brand-soft" : "border-line bg-surface",
              )}
            >
              Any available
            </button>
            <ul className="mt-2 space-y-2">
              {team.map((s) => {
                const shift = effectiveShift(s.id, appointments, staffStatus[s.id] ?? "available");
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setStylistId(s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left",
                        stylistId === s.id ? "border-ink bg-brand-soft" : "border-line bg-surface",
                      )}
                    >
                      <StylistAvatar stylist={s} size="sm" />
                      <span className="flex-1">
                        <span className="block text-body font-medium">{s.name}</span>
                        <span className="text-support text-muted">{s.title}</span>
                      </span>
                      <span className="text-support text-muted">
                        {shift === "available" ? "Available" : shift === "busy" ? "Currently busy" : shift.replace("_", " ")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {step === 3 && service && (
          <>
            <p className="text-section font-normal">New walk-in</p>
            <div className="mt-5 rounded-[24px] bg-surface p-5 text-body">
              <p className="font-medium">{name}</p>
              <p className="mt-2">{service.name}</p>
              <p className="text-muted">{stylistId === "any" ? "Any available" : team.find((t) => t.id === stylistId)?.name}</p>
              <p className="mt-4 text-support text-muted">Estimated duration</p>
              <p>{formatDuration(service.durationMin, service.durationMax)}</p>
            </div>
            <p className="mt-6 text-support font-medium text-muted">Payment</p>
            <div className="mt-2 space-y-2">
              {(["deposit", "now", "later"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left text-body capitalize",
                    payment === p ? "border-ink bg-brand-soft" : "border-line bg-surface",
                  )}
                >
                  {p === "now" ? "Pay now" : p === "later" ? "Pay later" : "Deposit"}
                </button>
              ))}
            </div>
            {payment !== "later" && (
              <p className="mt-3 text-support text-muted">
                We&apos;ll push a USSD prompt to the customer&apos;s number. Network is detected automatically.
              </p>
            )}
            {payMessage && <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-support text-brand">{payMessage}</p>}
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          {step < 3 ? (
            <Button
              className="h-12 w-full"
              disabled={
                (step === 0 && (!name.trim() || digits.length < 9)) || (step === 1 && !serviceId)
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button className="h-12 w-full" onClick={() => void submit()} disabled={!name || !serviceId || paying !== "idle"}>
              {payment === "later" ? "Add to queue" : `Collect ${payment === "now" ? "payment" : "deposit"}`}
            </Button>
          )}
          {step > 0 && (
            <button type="button" className="mt-3 w-full text-center text-support text-muted" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
        </div>
      </div>
      {paying !== "idle" && (
        <PayOverlay
          phase={paying}
          phone={phone}
          amount={service ? (payment === "now" ? quote(service.id).total : quote(service.id).deposit) : 0}
          onCancel={() => {
            payAbortRef.current?.abort();
            setPaying("idle");
            setPayMessage(
              pendingOrderId
                ? "Cancelled. Decline open USSD on the phone. Next try only checks status."
                : "Payment cancelled.",
            );
          }}
        />
      )}
    </main>
  );
}

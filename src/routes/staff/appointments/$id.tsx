import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/salon/confirm-sheet";
import { Photo } from "@/components/salon/photo";
import { PayOverlay } from "@/components/salon/pay-overlay";
import { ScreenHeader } from "@/components/salon/screen-header";
import { StatusPill } from "@/components/salon/status-pill";
import { getService, getStylist, SALON } from "@/lib/salon/data";
import { formatClock, formatDurationLong, formatTsh } from "@/lib/salon/format";
import { nextActionFor as nextAction } from "@/lib/engines/rules";
import { collectUntilPaid } from "@/lib/payments/collect-client";
import { useSalonStore } from "@/lib/salon/store";

export const Route = createFileRoute("/staff/appointments/$id")({
  component: StaffAppointment,
});

function StaffAppointment() {
  const { id } = Route.useParams();
  const appt = useSalonStore((s) => s.appointments.find((a) => a.id === id));
  const checkIn = useSalonStore((s) => s.checkIn);
  const startService = useSalonStore((s) => s.startService);
  const completeService = useSalonStore((s) => s.completeService);
  const cancelAppointment = useSalonStore((s) => s.cancelAppointment);
  const collectBalance = useSalonStore((s) => s.collectBalance);
  const markNoShow = useSalonStore((s) => s.markNoShow);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"start" | "complete" | "cancel" | "no_show" | null>(null);
  const [paying, setPaying] = useState<"idle" | "waiting" | "confirming">("idle");
  const [payMessage, setPayMessage] = useState("");

  if (!appt) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-title font-normal">Appointment unavailable</p>
        <Link to="/staff" className="mt-6 inline-block text-body">
          Back to today
        </Link>
      </main>
    );
  }

  const booking = appt;
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const action = nextAction(booking);
  const wa = `https://wa.me/${booking.customerPhone.replace(/\D/g, "").replace(/^0/, "255")}`;

  function runPrimary() {
    if (!action) return;
    if (action.event === "check_in") checkIn(booking.id);
    if (action.event === "start") setConfirm("start");
    if (action.event === "complete") setConfirm("complete");
    if (action.event === "review") void navigate({ to: "/staff/more" });
  }

  async function collectNow() {
    setPayMessage("");
    setPaying("waiting");
    const result = await collectUntilPaid({
      phone: booking.customerPhone,
      amount: booking.remaining,
      description: `Salon balance ${booking.id}`,
      bookingId: booking.id,
      customerId: booking.customerId,
      customerName: booking.customerName,
      method: booking.paymentMethod,
      kind: "balance",
    });
    if (result.ok) {
      setPaying("confirming");
      collectBalance(booking.id, result.orderId);
      setPaying("idle");
      return;
    }
    setPaying("idle");
    setPayMessage(result.message);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-10">
      <ScreenHeader title="Appointment" />
      <div className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-title font-normal">{appt.customerName}</p>
            <div className="mt-2">
              <StatusPill status={appt.status} />
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Customer</p>
          <p className="mt-2 text-body font-medium">{appt.customerName}</p>
          <p className="text-body text-muted">{appt.customerPhone}</p>
          <p className="mt-2 text-support text-muted">
            {appt.source === "walk_in" ? "Walk-in" : "Returning customer"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`tel:${appt.customerPhone}`}>
              <Button variant="secondary" className="h-11 w-full">
                Call
              </Button>
            </a>
            <a href={wa} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="h-11 w-full">
                WhatsApp
              </Button>
            </a>
          </div>
          <Link
            to="/staff/customers/$id"
            params={{ id: appt.customerId }}
            className="mt-3 block text-center text-support"
          >
            View customer
          </Link>
        </section>

        <section className="mt-4 rounded-[24px] bg-surface p-5">
          <p className="text-micro uppercase tracking-[0.16em] text-muted">Service</p>
          <p className="mt-2 text-body font-medium">{service?.name}</p>
          <p className="text-body text-muted">
            {stylist?.name ?? "Any available"}
            <br />
            {formatClock(appt.time)} · {service ? formatDurationLong(service.durationMin, service.durationMax) : ""}
          </p>
          <p className="mt-4 text-body tabular-nums">{formatTsh(appt.total)}</p>
          <p className="text-support text-muted">
            Deposit {formatTsh(appt.deposit)} · Balance {formatTsh(appt.remaining)}
          </p>
          {appt.remaining > 0 && (
            <Button
              variant="secondary"
              className="mt-4 h-11 w-full"
              onClick={() => void collectNow()}
              disabled={paying !== "idle"}
            >
              Collect balance
            </Button>
          )}
          {payMessage && <p className="mt-3 text-support text-muted">{payMessage}</p>}
        </section>

        {(appt.style || appt.notes || appt.photoData) && (
          <section className="mt-4 rounded-[24px] bg-surface p-5">
            <p className="text-micro uppercase tracking-[0.16em] text-muted">Preferences</p>
            {appt.style && (
              <p className="mt-3 text-body">
                <span className="text-muted">Preferred style · </span>
                {appt.style}
              </p>
            )}
            {appt.notes && <p className="mt-2 text-body">{appt.notes}</p>}
            {appt.sensitivities.length > 0 && (
              <p className="mt-2 text-support text-muted">{appt.sensitivities.join(" · ")}</p>
            )}
            {appt.photoData && (
              <div className="mt-4 overflow-hidden rounded-2xl">
                <img src={appt.photoData} alt="Reference" className="h-48 w-full object-cover" />
              </div>
            )}
          </section>
        )}

        {action && (
          <Button className="mt-8 h-13 w-full" onClick={runPrimary}>
            {action.label}
          </Button>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" className="h-11" onClick={() => setConfirm("no_show")}>
            No-show
          </Button>
          <Button variant="danger" className="h-11" onClick={() => setConfirm("cancel")}>
            Cancel
          </Button>
        </div>
        <p className="mt-6 text-support text-muted">{SALON.phone} · Contact salon</p>
      </div>

      <ConfirmSheet
        open={confirm === "start"}
        title="Start service?"
        body={
          <p>
            {appt.customerName}
            <br />
            {service?.name}
          </p>
        }
        confirmLabel="Start"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          startService(appt.id);
          setConfirm(null);
        }}
      />
      <ConfirmSheet
        open={confirm === "complete"}
        title="Complete appointment?"
        body={
          <p>
            {appt.customerName}
            <br />
            {service?.name}
          </p>
        }
        confirmLabel="Complete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          completeService(appt.id);
          setConfirm(null);
        }}
      />
      <ConfirmSheet
        open={confirm === "cancel"}
        title="Cancel this booking?"
        body={<p>{appt.customerName} will be notified.</p>}
        confirmLabel="Cancel booking"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          cancelAppointment(appt.id);
          setConfirm(null);
        }}
      />
      <ConfirmSheet
        open={confirm === "no_show"}
        title="Mark as no-show?"
        body={<p>{appt.customerName} didn’t arrive.</p>}
        confirmLabel="Mark no-show"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          markNoShow(appt.id);
          setConfirm(null);
        }}
      />
      {paying !== "idle" && (
        <PayOverlay phase={paying} phone={appt.customerPhone} amount={appt.remaining} />
      )}
    </main>
  );
}

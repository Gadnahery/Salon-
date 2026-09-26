import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatTsh, paymentLabel, statusLabel } from "@/lib/salon/format";
import { useSalonStore } from "@/lib/salon/store";
import type { PaymentStatus } from "@/lib/salon/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const payments = useSalonStore((s) => s.payments);
  const verifyPayment = useSalonStore((s) => s.verifyPayment);
  const refundPayment = useSalonStore((s) => s.refundPayment);
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(
    () => payments.filter((p) => (status === "all" ? true : p.status === status)),
    [payments, status],
  );
  const selected = payments.find((p) => p.id === open);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <h1 className="text-title font-normal">Payments</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {(["all", "paid", "pending", "partial", "failed", "refunded"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "h-10 rounded-full px-4 text-support capitalize",
              status === s ? "bg-ink text-surface" : "border border-line",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-[24px] bg-surface">
        <table className="w-full min-w-[40rem] text-left text-support">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">Booking</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-bg"
                onClick={() => setOpen(p.id)}
              >
                <td className="px-5 py-3">{p.bookingId}</td>
                <td className="px-5 py-3 text-body">{p.customerName}</td>
                <td className="px-5 py-3 tabular-nums">{formatTsh(p.amount)}</td>
                <td className="px-5 py-3">{paymentLabel(p.method)}</td>
                <td className="px-5 py-3 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30">
          <button type="button" className="flex-1" aria-label="Close" onClick={() => setOpen(null)} />
          <aside className="h-full w-full max-w-md bg-surface p-6">
            <p className="text-micro uppercase tracking-[0.16em] text-muted">Payment</p>
            <p className="mt-4 text-section font-normal">{formatTsh(selected.amount)}</p>
            <dl className="mt-6 space-y-3 text-body">
              <Row k="Customer" v={selected.customerName} />
              <Row k="Booking" v={selected.bookingId} />
              <Row k="Method" v={paymentLabel(selected.method)} />
              <Row k="Status" v={selected.status} />
              <Row k="Phone" v={selected.phone} />
              <Row k="Reference" v={selected.orderId ?? "—"} />
              <Row k="Kind" v={selected.kind} />
            </dl>
            <div className="mt-8 flex gap-2">
              {selected.status === "pending" && (
                <button type="button" className="h-11 rounded-2xl bg-ink px-4 text-support text-surface" onClick={() => verifyPayment(selected.id)}>
                  Verify
                </button>
              )}
              {selected.status === "paid" && (
                <button type="button" className="h-11 rounded-2xl border border-line px-4 text-support" onClick={() => refundPayment(selected.id)}>
                  Refund
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="capitalize">{v}</dd>
    </div>
  );
}

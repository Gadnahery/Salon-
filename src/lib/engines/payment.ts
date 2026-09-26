import { depositFor, priceFor } from "./rules";
import type { PaymentMethod, PaymentRecord, PaymentStatus } from "@/lib/salon/types";

export function quote(serviceId: string) {
  const total = priceFor(serviceId);
  const deposit = depositFor(serviceId, total);
  return { total, deposit, remaining: Math.max(0, total - deposit) };
}

export function mapProviderStatus(status: string): PaymentStatus {
  if (status === "completed" || status === "paid") return "paid";
  if (status === "failed") return "failed";
  if (status === "refunded") return "refunded";
  return "pending";
}

export function methodLabel(method: PaymentMethod) {
  if (method === "airtel") return "Airtel Money";
  if (method === "tigo") return "Tigo Pesa";
  return "M-Pesa";
}

export function paidToward(payments: PaymentRecord[], bookingId: string) {
  return payments
    .filter((p) => p.bookingId === bookingId && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function makePayment(input: {
  bookingId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  phone: string;
  description: string;
  kind: PaymentRecord["kind"];
  status?: PaymentStatus;
  orderId?: string;
}): PaymentRecord {
  const now = new Date().toISOString();
  return {
    id: `pay-${input.bookingId}-${Date.now()}`,
    bookingId: input.bookingId,
    customerId: input.customerId,
    customerName: input.customerName,
    amount: input.amount,
    method: input.method,
    status: input.status ?? "pending",
    orderId: input.orderId,
    phone: input.phone,
    description: input.description,
    createdAt: now,
    completedAt: input.status === "paid" ? now : undefined,
    kind: input.kind,
  };
}

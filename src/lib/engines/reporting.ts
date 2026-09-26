import { format } from "date-fns";
import type { Appointment, CustomerRecord, PaymentRecord } from "@/lib/salon/types";

export function paidRevenue(payments: PaymentRecord[], onDate?: string) {
  return payments
    .filter((p) => p.status === "paid")
    .filter((p) => (onDate ? (p.completedAt ?? p.createdAt).slice(0, 10) === onDate : true))
    .reduce((sum, p) => sum + p.amount, 0);
}

export function bookingCounts(appointments: Appointment[]) {
  return {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    noShow: appointments.filter((a) => a.status === "no_show").length,
    pending: appointments.filter((a) => a.status === "confirmed" || a.status === "checked_in" || a.status === "in_service").length,
  };
}

export function serviceDemand(appointments: Appointment[]) {
  const map: Record<string, number> = {};
  for (const a of appointments) {
    if (a.status === "cancelled" || a.status === "expired") continue;
    map[a.serviceId] = (map[a.serviceId] ?? 0) + 1;
  }
  const rows = Object.entries(map)
    .map(([id, n]) => ({ serviceId: id, n }))
    .sort((a, b) => b.n - a.n);
  const total = rows.reduce((s, r) => s + r.n, 0) || 1;
  return rows.map((r) => ({ ...r, pct: Math.round((r.n / total) * 100) }));
}

export function revenueSeries(payments: PaymentRecord[], days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = format(d, "yyyy-MM-dd");
    return {
      day: format(d, days > 10 ? "d" : "EEE"),
      key,
      value: paidRevenue(payments, key),
    };
  });
}

export function customerTrends(customers: CustomerRecord[], appointments: Appointment[]) {
  const returning = customers.filter((c) => c.returning).length;
  const completed = appointments.filter((a) => a.status === "completed");
  const avgValue =
    completed.length === 0 ? 0 : Math.round(completed.reduce((s, a) => s + a.total, 0) / completed.length);
  const repeats = customers.filter((c) => appointments.filter((a) => a.customerId === c.id).length > 1).length;
  return {
    newCustomers: customers.length - returning,
    returning,
    repeatRate: customers.length ? Math.round((repeats / customers.length) * 100) : 0,
    averageBookingValue: avgValue,
  };
}

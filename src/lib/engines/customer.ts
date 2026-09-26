import type { Appointment, CustomerRecord } from "@/lib/salon/types";

export function findCustomerByPhone(customers: CustomerRecord[], phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-9);
  if (!digits) return null;
  return customers.find((c) => c.phone.replace(/\D/g, "").endsWith(digits)) ?? null;
}

export function customerStats(customerId: string, appointments: Appointment[]) {
  const mine = appointments.filter((a) => a.customerId === customerId);
  return {
    total: mine.length,
    completed: mine.filter((a) => a.status === "completed").length,
    cancelled: mine.filter((a) => a.status === "cancelled").length,
    noShow: mine.filter((a) => a.status === "no_show").length,
    spent: mine.filter((a) => a.status === "completed").reduce((s, a) => s + a.total, 0),
    lastVisit: mine
      .filter((a) => a.status === "completed")
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]?.date,
  };
}

export function isReturning(customerId: string, appointments: Appointment[]) {
  return appointments.filter((a) => a.customerId === customerId && a.status === "completed").length >= 1;
}

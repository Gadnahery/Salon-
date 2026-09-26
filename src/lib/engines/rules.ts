import { parseISO } from "date-fns";
import { getService } from "@/lib/salon/data";
import type { Appointment, AppointmentStatus, StaffRole } from "@/lib/salon/types";

export const SALON_OPEN = "09:00";
export const SALON_CLOSE = "19:00";
export const MIN_LEAD_MINUTES = 30;
export const CANCEL_DEPOSIT_HOURS = 24;

export const STATUS_FLOW: Record<AppointmentStatus, AppointmentStatus[]> = {
  payment_pending: ["confirmed", "expired", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show", "confirmed"],
  checked_in: ["in_service", "cancelled", "no_show"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
  expired: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus) {
  return STATUS_FLOW[from]?.includes(to) ?? false;
}

export function minutesUntil(date: string, time: string, now = new Date()) {
  return Math.round((parseISO(`${date}T${time}:00`).getTime() - now.getTime()) / 60000);
}

export function hoursUntil(date: string, time: string, now = new Date()) {
  return minutesUntil(date, time, now) / 60;
}

export function depositFor(serviceId: string, total: number) {
  const service = getService(serviceId);
  const pct = service?.depositPercent ?? 50;
  return Math.round(total * (pct / 100));
}

export function priceFor(serviceId: string) {
  const service = getService(serviceId);
  if (!service) return 0;
  return service.priceMax ?? service.priceMin;
}

export function durationFor(serviceId: string) {
  const service = getService(serviceId);
  return service?.durationMax ?? service?.durationMin ?? 60;
}

export function cancellationKeepsDeposit(date: string, time: string, now = new Date()) {
  return hoursUntil(date, time, now) < CANCEL_DEPOSIT_HOURS;
}

export type StaffAction =
  | "viewAssigned"
  | "viewAllAppointments"
  | "manageQueue"
  | "walkIn"
  | "assignStylist"
  | "checkPayments"
  | "rescheduleAny"
  | "contactCustomer"
  | "manageOwnAvailability"
  | "manageStaff"
  | "manageServices"
  | "viewReports"
  | "manageSettings"
  | "manageCustomers"
  | "audit"
  | "moderateReviews";

const ROLE_ACTIONS: Record<StaffRole | "customer", StaffAction[]> = {
  customer: [],
  stylist: [
    "viewAssigned",
    "manageQueue",
    "walkIn",
    "contactCustomer",
    "manageOwnAvailability",
  ],
  receptionist: [
    "viewAssigned",
    "viewAllAppointments",
    "manageQueue",
    "walkIn",
    "assignStylist",
    "checkPayments",
    "rescheduleAny",
    "contactCustomer",
    "manageCustomers",
  ],
  manager: [
    "viewAssigned",
    "viewAllAppointments",
    "manageQueue",
    "walkIn",
    "assignStylist",
    "checkPayments",
    "rescheduleAny",
    "contactCustomer",
    "manageOwnAvailability",
    "manageStaff",
    "manageServices",
    "viewReports",
    "manageCustomers",
    "moderateReviews",
  ],
  admin: [
    "viewAssigned",
    "viewAllAppointments",
    "manageQueue",
    "walkIn",
    "assignStylist",
    "checkPayments",
    "rescheduleAny",
    "contactCustomer",
    "manageOwnAvailability",
    "manageStaff",
    "manageServices",
    "viewReports",
    "manageSettings",
    "manageCustomers",
    "audit",
    "moderateReviews",
  ],
};

export function can(role: StaffRole | "customer", action: StaffAction) {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function isOpenStatus(s: AppointmentStatus) {
  return s === "payment_pending" || s === "confirmed" || s === "checked_in" || s === "in_service";
}

export function isFloorStatus(s: AppointmentStatus) {
  return s === "checked_in" || s === "in_service";
}

export function nextActionFor(a: Appointment): { label: string; event: "check_in" | "start" | "complete" | "review" } | null {
  if (a.status === "confirmed") return { label: "Check in customer", event: "check_in" };
  if (a.status === "checked_in") return { label: "Start service", event: "start" };
  if (a.status === "in_service") return { label: "Complete service", event: "complete" };
  if (a.status === "completed") return { label: "View review", event: "review" };
  return null;
}

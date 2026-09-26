import { format, isToday, isTomorrow, parseISO } from "date-fns";
import type { Appointment, AppointmentStatus, Category, PaymentMethod } from "./types";

export function formatTsh(n: number) {
  return `TSh ${n.toLocaleString("en-US")}`;
}

export function formatPriceRange(min: number, max?: number) {
  if (!max || max === min) return formatTsh(min);
  return `From ${formatTsh(min)}`;
}

export function formatDuration(min: number, max?: number) {
  if (!max || max === min) return min >= 60 ? `${Math.round(min / 60)} hr${min >= 120 ? "s" : ""}` : `${min} min`;
  const a = min >= 60 ? `${min / 60}h` : `${min} min`;
  const b = max >= 60 ? `${max / 60}h` : `${max} min`;
  if (min < 60 && max < 60) return `${min}–${max} min`;
  return `${min}–${max} min`;
}

export function formatDurationLong(min: number, max?: number) {
  if (!max || max === min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
  }
  return `${min}–${max} min`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatApptWhen(date: string, time: string) {
  const d = parseISO(`${date}T${time}:00`);
  const clock = format(d, "h:mm a");
  if (isToday(d)) return `Today · ${clock}`;
  if (isTomorrow(d)) return `Tomorrow · ${clock}`;
  return `${format(d, "EEE d MMM")} · ${clock}`;
}

export function formatLongDate(date: string) {
  return format(parseISO(`${date}T12:00:00`), "EEEE, d MMMM");
}

export function formatShortDate(date: string) {
  return format(parseISO(`${date}T12:00:00`), "EEE, d MMM");
}

export function formatClock(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
}

export function categoryLabel(c: Category) {
  const map: Record<Category, string> = {
    hair: "Hair",
    nails: "Nails",
    makeup: "Makeup",
    treatments: "Treatments",
  };
  return map[c];
}

export function paymentLabel(m: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    mpesa: "M-Pesa",
    airtel: "Airtel Money",
    tigo: "Tigo Pesa",
  };
  return map[m];
}

export function statusLabel(s: AppointmentStatus) {
  const map: Record<AppointmentStatus, string> = {
    payment_pending: "Payment pending",
    confirmed: "Confirmed",
    checked_in: "Checked in",
    in_service: "In service",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
    expired: "Expired",
  };
  return map[s];
}

export type DisplayPhase =
  | "payment_pending"
  | "confirmed"
  | "today"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired";

export function displayPhase(a: Appointment, now = new Date()): DisplayPhase {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "completed") return "completed";
  if (a.status === "no_show") return "cancelled";
  if (a.status === "expired") return "payment_pending";
  if (a.status === "payment_pending") return "payment_pending";
  if (a.status === "in_service") return "in_service";
  if (a.status === "checked_in") return "checked_in";
  const d = parseISO(`${a.date}T${a.time}:00`);
  if (isToday(d) || (d.getTime() <= now.getTime() && a.status === "confirmed")) return "today";
  return "confirmed";
}

export function phaseCopy(phase: DisplayPhase, time?: string) {
  switch (phase) {
    case "payment_pending":
      return {
        title: "Payment pending",
        body: "Complete your payment to confirm this appointment.",
      };
    case "confirmed":
      return {
        title: "Confirmed",
        body: "Your appointment is confirmed. We'll remind you before your visit.",
      };
    case "today":
      return {
        title: "Today",
        body: time ? `Your appointment is today at ${formatClock(time)}.` : "Your appointment is today.",
      };
    case "checked_in":
      return {
        title: "Checked in",
        body: "You're checked in. Your stylist will take care of you shortly.",
      };
    case "in_service":
      return {
        title: "Your stylist is ready",
        body: "Your appointment is starting now.",
      };
    case "completed":
      return {
        title: "Completed",
        body: "Thanks for visiting Salon.",
      };
    case "cancelled":
      return {
        title: "Cancelled",
        body: "This appointment has been cancelled.",
      };
    case "no_show":
      return {
        title: "No-show",
        body: "This appointment was marked as a no-show.",
      };
    default:
      return {
        title: "Appointment",
        body: "Details for this visit.",
      };
  }
}

export function nextOpenDays(count = 14) {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function nextBookingId(n: number) {
  return `UL-${String(n).padStart(5, "0")}`;
}

export function hashUnavailable(date: string, stylistId: string) {
  const times = TIME_SLOTS;
  let h = 0;
  const key = date + stylistId;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const a = times[h % times.length];
  const b = times[(h * 7) % times.length];
  return new Set(a === b ? [a] : [a, b]);
}

export function dateHasAvailability(date: string, stylistId: string) {
  return hashUnavailable(date, stylistId).size < TIME_SLOTS.length;
}

export const TIME_SLOTS = ["09:00", "10:00", "11:30", "13:00", "14:00", "15:00", "16:30", "17:30"];

export const TIME_GROUPS: { label: string; slots: string[] }[] = [
  { label: "Morning", slots: ["09:00", "10:00", "11:30"] },
  { label: "Afternoon", slots: ["13:00", "14:00", "15:00"] },
  { label: "Evening", slots: ["16:30", "17:30"] },
];

export const categoryOrder: Category[] = ["hair", "nails", "makeup", "treatments"];

export const SENSITIVITY_OPTIONS = ["Sensitive scalp", "Light tension", "First time", "Other"];

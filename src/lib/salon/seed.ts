import { addDays, addMinutes, format, subDays } from "date-fns";
import type {
  Appointment,
  AuditEvent,
  CustomerRecord,
  Notice,
  OfferRecord,
  PaymentRecord,
  ReviewRecord,
} from "./types";

function isoAt(date: Date) {
  return date.toISOString();
}

function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function hm(d: Date) {
  return format(d, "HH:mm");
}

export const CUSTOMER_ID = "cust-gadna";

export function seedCustomers(): CustomerRecord[] {
  return [
    {
      id: CUSTOMER_ID,
      name: "Gadna Henry",
      phone: "+255 713 448 220",
      since: "2026-03-12",
      notes: "Prefers Amina for braiding. Light tension.",
      preferredStylistId: "amina",
      returning: true,
    },
    {
      id: "cust-sarah",
      name: "Sarah Mwinyi",
      phone: "+255 712 441 190",
      since: "2026-03-04",
      notes: "Prefers light tension. Usually books Amina.",
      preferredStylistId: "amina",
      returning: true,
    },
    {
      id: "cust-neema",
      name: "Neema Hassan",
      phone: "+255 755 882 014",
      since: "2026-05-18",
      notes: "Regular for gel colour — terracotta.",
      preferredStylistId: "grace",
      returning: true,
    },
    {
      id: "cust-james",
      name: "James Peter",
      phone: "+255 678 221 440",
      since: "2026-06-02",
      notes: "",
      returning: true,
    },
    {
      id: "cust-mary",
      name: "Mary Juma",
      phone: "+255 713 990 221",
      since: "2026-04-11",
      notes: "Occasion makeup, brings reference photos.",
      preferredStylistId: "sarah",
      returning: true,
    },
    {
      id: "cust-john",
      name: "John Mwamba",
      phone: "+255 754 110 883",
      since: "2026-07-20",
      notes: "",
    },
    {
      id: "cust-asha",
      name: "Asha Ali",
      phone: "+255 765 441 009",
      since: "2026-08-03",
      notes: "",
    },
    {
      id: "cust-baraka",
      name: "Baraka Temba",
      phone: "+255 622 118 440",
      since: "2026-09-25",
      notes: "Walk-in.",
    },
  ];
}

export function seedAppointments(): Appointment[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const d = ymd(today);
  const yesterday = ymd(subDays(today, today.getDay() === 1 ? 2 : 1));
  const lastWeek = ymd(subDays(today, 9));
  const cancelledDay = ymd(subDays(today, 18));
  const tomorrow = ymd(addDays(today, today.getDay() === 6 ? 2 : 1));

  const mk = (
    partial: Omit<Appointment, "sensitivities" | "photoName" | "createdAt" | "source"> & {
      sensitivities?: string[];
      photoName?: string;
      createdAt?: string;
      source?: Appointment["source"];
    },
  ): Appointment => ({
    sensitivities: [],
    photoName: "",
    createdAt: isoAt(subDays(now, 1)),
    source: "appointment",
    ...partial,
  });

  const rows = [
    mk({
      id: "UL-48280",
      serviceId: "hair-braiding",
      stylistId: "amina",
      anyStylist: false,
      date: d,
      time: "09:00",
      style: "Medium knotless braids",
      notes: "Light tension",
      sensitivities: ["Light tension"],
      total: 60000,
      deposit: 30000,
      remaining: 30000,
      paymentMethod: "mpesa",
      status: "completed",
      customerId: "cust-sarah",
      customerName: "Sarah Mwinyi",
      customerPhone: "+255 712 441 190",
      checkedInAt: isoAt(addMinutes(today, 9 * 60 - 8)),
      startedAt: isoAt(addMinutes(today, 9 * 60 + 3)),
      completedAt: isoAt(addMinutes(today, 10 * 60 + 21)),
    }),
    mk({
      id: "UL-48285",
      serviceId: "gel-manicure",
      stylistId: "grace",
      anyStylist: false,
      date: d,
      time: "10:00",
      style: "",
      notes: "",
      total: 25000,
      deposit: 12500,
      remaining: 12500,
      paymentMethod: "airtel",
      status: "in_service",
      customerId: "cust-neema",
      customerName: "Neema Hassan",
      customerPhone: "+255 755 882 014",
      checkedInAt: isoAt(addMinutes(today, 9 * 60 + 52)),
      startedAt: isoAt(addMinutes(today, 10 * 60 + 3)),
    }),
    mk({
      id: "UL-48291",
      serviceId: "hair-braiding",
      stylistId: "amina",
      anyStylist: false,
      date: d,
      time: "10:30",
      style: "Medium knotless braids",
      notes: "Light tension, sensitive scalp.",
      sensitivities: ["Sensitive scalp", "Light tension"],
      total: 60000,
      deposit: 30000,
      remaining: 30000,
      paymentMethod: "mpesa",
      status: "confirmed",
      customerId: CUSTOMER_ID,
      customerName: "Gadna Henry",
      customerPhone: "+255 713 448 220",
    }),
    mk({
      id: "UL-48288",
      serviceId: "deep-conditioning",
      stylistId: "sarah",
      anyStylist: false,
      date: d,
      time: "11:30",
      style: "",
      notes: "",
      total: 40000,
      deposit: 20000,
      remaining: 20000,
      paymentMethod: "mpesa",
      status: "checked_in",
      customerId: "cust-james",
      customerName: "James Peter",
      customerPhone: "+255 678 221 440",
      checkedInAt: isoAt(addMinutes(now, -14)),
    }),
    mk({
      id: "UL-48290",
      serviceId: "everyday-glam",
      stylistId: "amina",
      anyStylist: false,
      date: d,
      time: "13:00",
      style: "",
      notes: "",
      total: 50000,
      deposit: 25000,
      remaining: 25000,
      paymentMethod: "mpesa",
      status: "confirmed",
      customerId: "cust-mary",
      customerName: "Mary Juma",
      customerPhone: "+255 713 990 221",
    }),
    mk({
      id: "UL-48293",
      serviceId: "deep-conditioning",
      stylistId: "sarah",
      anyStylist: false,
      date: d,
      time: "14:00",
      style: "",
      notes: "",
      total: 40000,
      deposit: 20000,
      remaining: 20000,
      paymentMethod: "tigo",
      status: "confirmed",
      customerId: "cust-john",
      customerName: "John Mwamba",
      customerPhone: "+255 754 110 883",
    }),
    mk({
      id: "UL-48295",
      serviceId: "haircut",
      stylistId: "sarah",
      anyStylist: true,
      date: d,
      time: hm(addMinutes(now, -12)),
      style: "",
      notes: "",
      total: 20000,
      deposit: 0,
      remaining: 20000,
      paymentMethod: "mpesa",
      status: "checked_in",
      customerId: "cust-baraka",
      customerName: "Baraka Temba",
      customerPhone: "+255 622 118 440",
      source: "walk_in",
      checkedInAt: isoAt(addMinutes(now, -12)),
    }),
    mk({
      id: "UL-48296",
      serviceId: "pedicure",
      stylistId: "grace",
      anyStylist: false,
      date: d,
      time: hm(addMinutes(now, -18)),
      style: "",
      notes: "",
      total: 25000,
      deposit: 0,
      remaining: 25000,
      paymentMethod: "mpesa",
      status: "checked_in",
      customerId: "cust-asha",
      customerName: "Asha Ali",
      customerPhone: "+255 765 441 009",
      source: "walk_in",
      checkedInAt: isoAt(addMinutes(now, -18)),
    }),
    mk({
      id: "UL-48270",
      serviceId: "everyday-glam",
      stylistId: "sarah",
      anyStylist: false,
      date: lastWeek,
      time: "11:30",
      style: "",
      notes: "",
      total: 50000,
      deposit: 50000,
      remaining: 0,
      paymentMethod: "airtel",
      status: "completed",
      customerId: CUSTOMER_ID,
      customerName: "Gadna Henry",
      customerPhone: "+255 713 448 220",
      completedAt: isoAt(subDays(now, 9)),
    }),
    mk({
      id: "UL-47940",
      serviceId: "gel-manicure",
      stylistId: "grace",
      anyStylist: false,
      date: cancelledDay,
      time: "13:00",
      style: "",
      notes: "",
      total: 25000,
      deposit: 0,
      remaining: 25000,
      paymentMethod: "tigo",
      status: "cancelled",
      customerId: CUSTOMER_ID,
      customerName: "Gadna Henry",
      customerPhone: "+255 713 448 220",
    }),
    mk({
      id: "UL-48110",
      serviceId: "box-braids",
      stylistId: "amina",
      anyStylist: false,
      date: yesterday,
      time: "10:00",
      style: "Waist-length",
      notes: "",
      total: 70000,
      deposit: 35000,
      remaining: 0,
      paymentMethod: "mpesa",
      status: "completed",
      customerId: "cust-sarah",
      customerName: "Sarah Mwinyi",
      customerPhone: "+255 712 441 190",
      completedAt: isoAt(subDays(now, 1)),
    }),
    mk({
      id: "UL-48301",
      serviceId: "hair-braiding",
      stylistId: "amina",
      anyStylist: false,
      date: tomorrow,
      time: "10:00",
      style: "",
      notes: "",
      total: 60000,
      deposit: 30000,
      remaining: 30000,
      paymentMethod: "mpesa",
      status: "confirmed",
      customerId: "cust-sarah",
      customerName: "Sarah Mwinyi",
      customerPhone: "+255 712 441 190",
    }),
    mk({
      id: "UL-48240",
      serviceId: "bridal-makeup",
      stylistId: "sarah",
      anyStylist: false,
      date: ymd(subDays(today, 3)),
      time: "08:30",
      style: "",
      notes: "",
      total: 100000,
      deposit: 50000,
      remaining: 0,
      paymentMethod: "mpesa",
      status: "completed",
      customerId: "cust-mary",
      customerName: "Mary Juma",
      customerPhone: "+255 713 990 221",
      completedAt: isoAt(subDays(now, 3)),
    }),
  ];

  return rows.map((a) => {
    const total = 500;
    const deposit = a.deposit > 0 ? 500 : 0;
    return { ...a, total, deposit, remaining: total - deposit };
  });
}

export function seedNotices(): Notice[] {
  const now = new Date().toISOString();
  return [
    {
      id: "n1",
      title: "You're booked",
      body: "Hair Braiding with Amina is confirmed. We'll see you at 10:30 AM.",
      time: now,
      read: false,
      appointmentId: "UL-48291",
      audience: "customer",
    },
    {
      id: "n2",
      title: "Payment received",
      body: "Your deposit of TSh 500 was confirmed on M-Pesa.",
      time: now,
      read: false,
      appointmentId: "UL-48291",
      audience: "customer",
    },
    {
      id: "ns1",
      title: "New booking",
      body: "Gadna booked Hair Braiding for 10:30 AM.",
      time: now,
      read: false,
      appointmentId: "UL-48291",
      audience: "staff",
    },
    {
      id: "ns2",
      title: "Customer checked in",
      body: "James Peter has arrived for Hair Treatment.",
      time: now,
      read: false,
      appointmentId: "UL-48288",
      audience: "staff",
    },
    {
      id: "ns3",
      title: "Walk-in added",
      body: "Baraka Temba was added to the queue for a Haircut.",
      time: now,
      read: false,
      appointmentId: "UL-48295",
      audience: "staff",
    },
    {
      id: "na1",
      title: "2 payments awaiting verification",
      body: "Walk-in balances still open on the floor.",
      time: now,
      read: false,
      audience: "admin",
    },
    {
      id: "na2",
      title: "New bookings today",
      body: "3 new bookings need a look before the afternoon.",
      time: now,
      read: false,
      audience: "admin",
    },
  ];
}

export function seedPayments(appointments: Appointment[]): PaymentRecord[] {
  return appointments
    .filter((a) => a.deposit > 0)
    .map((a) => ({
      id: `pay-${a.id}`,
      bookingId: a.id,
      customerId: a.customerId,
      customerName: a.customerName,
      amount: a.deposit,
      method: a.paymentMethod,
      status: a.status === "cancelled" || a.status === "expired" ? "refunded" : a.status === "payment_pending" ? "pending" : "paid",
      phone: a.customerPhone,
      description: `Deposit ${a.id}`,
      createdAt: a.createdAt,
      completedAt: a.status === "payment_pending" ? undefined : a.createdAt,
      kind: "deposit" as const,
    }));
}

export function seedReviews(): ReviewRecord[] {
  return [
    {
      id: "rev-1",
      appointmentId: "UL-48270",
      customerName: "Gadna Henry",
      serviceId: "everyday-glam",
      stylistId: "sarah",
      rating: 5,
      quote: "Looked like me, just more rested.",
      published: true,
      createdAt: subDays(new Date(), 8).toISOString(),
    },
    {
      id: "rev-2",
      appointmentId: "UL-48110",
      customerName: "Sarah Mwinyi",
      serviceId: "box-braids",
      stylistId: "amina",
      rating: 5,
      quote: "Beautiful work. Light tension, exactly as asked.",
      published: true,
      createdAt: subDays(new Date(), 1).toISOString(),
    },
    {
      id: "rev-3",
      appointmentId: "UL-48240",
      customerName: "Mary Juma",
      serviceId: "bridal-makeup",
      stylistId: "sarah",
      rating: 5,
      quote: "Very professional. They even stayed for the photographs.",
      published: true,
      createdAt: subDays(new Date(), 3).toISOString(),
    },
  ];
}

export function seedOffers(): OfferRecord[] {
  return [
    {
      id: "off-braid",
      title: "10% off Hair Braiding",
      copy: "For selected weekday appointments.",
      serviceId: "hair-braiding",
      discountPercent: 10,
      start: "2026-09-20",
      end: "2026-10-05",
      active: false,
    },
  ];
}

export function seedAudit(): AuditEvent[] {
  const now = new Date();
  return [
    {
      id: "aud-1",
      actor: "Amina",
      action: "changed booking UL-48280 from Confirmed → Checked in",
      target: "UL-48280",
      before: "confirmed",
      after: "checked_in",
      at: addMinutes(now, -120).toISOString(),
    },
    {
      id: "aud-2",
      actor: "Grace",
      action: "started service for Neema Hassan",
      target: "UL-48285",
      before: "checked_in",
      after: "in_service",
      at: addMinutes(now, -40).toISOString(),
    },
    {
      id: "aud-3",
      actor: "Zahra",
      action: "added walk-in Baraka Temba",
      target: "UL-48295",
      after: "checked_in",
      at: addMinutes(now, -12).toISOString(),
    },
  ];
}

export const defaultProfile = {
  name: "Gadna Henry",
  phone: "+255 713 448 220",
  mpesaPhone: "+255 713 448 220",
  reminders: true,
  stylistReadyAlerts: true,
};

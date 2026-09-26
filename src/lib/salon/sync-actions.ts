import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseSelect, supabaseUpsert } from "./supabase";

const appointmentSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  stylistId: z.string(),
  anyStylist: z.boolean(),
  date: z.string(),
  time: z.string(),
  style: z.string(),
  notes: z.string(),
  total: z.number(),
  deposit: z.number(),
  remaining: z.number(),
  paymentMethod: z.string(),
  status: z.string(),
  source: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  paymentOrderId: z.string().optional(),
  checkedInAt: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

const paymentSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  amount: z.number(),
  method: z.string(),
  status: z.string(),
  orderId: z.string().optional(),
  phone: z.string(),
  description: z.string(),
  kind: z.string(),
});

const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  since: z.string().optional(),
  notes: z.string().optional(),
  preferredStylistId: z.string().optional(),
});

const noticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  audience: z.string(),
  appointmentId: z.string().optional(),
});

const queueSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  position: z.number(),
  status: z.string(),
  arrivedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

const auditSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
});

const reviewSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  customerName: z.string(),
  serviceId: z.string(),
  stylistId: z.string(),
  rating: z.number(),
  quote: z.string(),
  published: z.boolean(),
});

async function runSql(text: string, params: unknown[]) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql.query(text, params);
}

export const upsertAppointmentFn = createServerFn({ method: "POST" })
  .validator(appointmentSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_appointments
          (id, service_id, stylist_id, any_stylist, date, time, style, notes, total, deposit, remaining,
           payment_method, status, source, customer_id, customer_name, customer_phone, payment_order_id,
           checked_in_at, started_at, completed_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         on conflict (id) do update set
           status = excluded.status,
           remaining = excluded.remaining,
           deposit = excluded.deposit,
           stylist_id = excluded.stylist_id,
           any_stylist = excluded.any_stylist,
           date = excluded.date,
           time = excluded.time,
           payment_order_id = excluded.payment_order_id,
           checked_in_at = excluded.checked_in_at,
           started_at = excluded.started_at,
           completed_at = excluded.completed_at`,
        [
          data.id,
          data.serviceId,
          data.stylistId,
          data.anyStylist,
          data.date,
          data.time,
          data.style,
          data.notes,
          data.total,
          data.deposit,
          data.remaining,
          data.paymentMethod,
          data.status,
          data.source,
          data.customerId,
          data.customerName,
          data.customerPhone,
          data.paymentOrderId ?? null,
          data.checkedInAt ?? null,
          data.startedAt ?? null,
          data.completedAt ?? null,
        ],
      );
    } catch {
      /* local schema may still be booting */
    }
    await supabaseUpsert("salon_appointments", {
      id: data.id,
      service_id: data.serviceId,
      stylist_id: data.stylistId,
      any_stylist: data.anyStylist,
      date: data.date,
      time: data.time,
      style: data.style,
      notes: data.notes,
      total: data.total,
      deposit: data.deposit,
      remaining: data.remaining,
      payment_method: data.paymentMethod,
      status: data.status,
      source: data.source,
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      payment_order_id: data.paymentOrderId ?? null,
      checked_in_at: data.checkedInAt ?? null,
      started_at: data.startedAt ?? null,
      completed_at: data.completedAt ?? null,
    });
    return { ok: true as const };
  });

export const upsertPaymentFn = createServerFn({ method: "POST" })
  .validator(paymentSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_payments
          (id, booking_id, customer_id, customer_name, amount, method, status, order_id, phone, description, kind)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set status = excluded.status, order_id = excluded.order_id`,
        [
          data.id,
          data.bookingId,
          data.customerId,
          data.customerName,
          data.amount,
          data.method,
          data.status,
          data.orderId ?? null,
          data.phone,
          data.description,
          data.kind,
        ],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_payments", {
      id: data.id,
      booking_id: data.bookingId,
      customer_id: data.customerId,
      customer_name: data.customerName,
      amount: data.amount,
      method: data.method,
      status: data.status,
      order_id: data.orderId ?? null,
      phone: data.phone,
      description: data.description,
      kind: data.kind,
    });
    return { ok: true as const };
  });

export const upsertCustomerFn = createServerFn({ method: "POST" })
  .validator(customerSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_customers (id, name, phone, since, notes, preferred_stylist_id)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (id) do update set name = excluded.name, phone = excluded.phone, notes = excluded.notes`,
        [data.id, data.name, data.phone, data.since ?? null, data.notes ?? "", data.preferredStylistId ?? null],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_customers", {
      id: data.id,
      name: data.name,
      phone: data.phone,
      since: data.since ?? null,
      notes: data.notes ?? "",
      preferred_stylist_id: data.preferredStylistId ?? null,
    });
    return { ok: true as const };
  });

export const upsertNoticeFn = createServerFn({ method: "POST" })
  .validator(noticeSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_notifications (id, title, body, audience, appointment_id)
         values ($1,$2,$3,$4,$5)
         on conflict (id) do nothing`,
        [data.id, data.title, data.body, data.audience, data.appointmentId ?? null],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_notifications", {
      id: data.id,
      title: data.title,
      body: data.body,
      audience: data.audience,
      appointment_id: data.appointmentId ?? null,
    });
    return { ok: true as const };
  });

export const upsertQueueFn = createServerFn({ method: "POST" })
  .validator(queueSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_queue (id, appointment_id, position, status, arrived_at, started_at, completed_at)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (id) do update set position = excluded.position, status = excluded.status,
           started_at = excluded.started_at, completed_at = excluded.completed_at`,
        [
          data.id,
          data.appointmentId,
          data.position,
          data.status,
          data.arrivedAt,
          data.startedAt ?? null,
          data.completedAt ?? null,
        ],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_queue", {
      id: data.id,
      appointment_id: data.appointmentId,
      position: data.position,
      status: data.status,
      arrived_at: data.arrivedAt,
      started_at: data.startedAt ?? null,
      completed_at: data.completedAt ?? null,
    });
    return { ok: true as const };
  });

export const upsertAuditFn = createServerFn({ method: "POST" })
  .validator(auditSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_audit (id, actor, action, target, before_value, after_value)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (id) do nothing`,
        [data.id, data.actor, data.action, data.target, data.before ?? null, data.after ?? null],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_audit", {
      id: data.id,
      actor: data.actor,
      action: data.action,
      target: data.target,
      before_value: data.before ?? null,
      after_value: data.after ?? null,
    });
    return { ok: true as const };
  });

export const upsertReviewFn = createServerFn({ method: "POST" })
  .validator(reviewSchema)
  .handler(async ({ data }) => {
    try {
      await runSql(
        `insert into salon_reviews (id, appointment_id, customer_name, service_id, stylist_id, rating, quote, published)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set published = excluded.published, quote = excluded.quote, rating = excluded.rating`,
        [
          data.id,
          data.appointmentId,
          data.customerName,
          data.serviceId,
          data.stylistId,
          data.rating,
          data.quote,
          data.published,
        ],
      );
    } catch {
      /* ignore */
    }
    await supabaseUpsert("salon_reviews", {
      id: data.id,
      appointment_id: data.appointmentId,
      customer_name: data.customerName,
      service_id: data.serviceId,
      stylist_id: data.stylistId,
      rating: data.rating,
      quote: data.quote,
      published: data.published,
    });
    return { ok: true as const };
  });

function asText(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function asDate(v: unknown) {
  const t = asText(v);
  return t ? t.slice(0, 10) : "";
}

export const pullSalonStateFn = createServerFn({ method: "POST" }).handler(async () => {
  const [appointments, customers, payments, queue, notices, reviews, audit] = await Promise.all([
    supabaseSelect<Record<string, unknown>>("salon_appointments", "select=*&order=created_at.desc"),
    supabaseSelect<Record<string, unknown>>("salon_customers", "select=*"),
    supabaseSelect<Record<string, unknown>>("salon_payments", "select=*&order=created_at.desc"),
    supabaseSelect<Record<string, unknown>>("salon_queue", "select=*"),
    supabaseSelect<Record<string, unknown>>("salon_notifications", "select=*&order=created_at.desc"),
    supabaseSelect<Record<string, unknown>>("salon_reviews", "select=*"),
    supabaseSelect<Record<string, unknown>>("salon_audit", "select=*&order=created_at.desc&limit=80"),
  ]);

  return {
    appointments: appointments.map((r) => ({
      id: String(r.id),
      serviceId: String(r.service_id),
      stylistId: String(r.stylist_id),
      anyStylist: Boolean(r.any_stylist),
      date: asDate(r.date),
      time: String(r.time),
      style: String(r.style ?? ""),
      notes: String(r.notes ?? ""),
      sensitivities: [] as string[],
      photoName: "",
      total: Number(r.total),
      deposit: Number(r.deposit),
      remaining: Number(r.remaining),
      paymentMethod: (r.payment_method as "mpesa" | "airtel" | "tigo") ?? "mpesa",
      status: String(r.status) as never,
      createdAt: asText(r.created_at) ?? new Date().toISOString(),
      customerId: String(r.customer_id),
      customerName: String(r.customer_name),
      customerPhone: String(r.customer_phone),
      source: (r.source as "appointment" | "walk_in") ?? "appointment",
      paymentOrderId: asText(r.payment_order_id),
      checkedInAt: asText(r.checked_in_at),
      startedAt: asText(r.started_at),
      completedAt: asText(r.completed_at),
    })),
    customers: customers.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      since: asDate(r.since) || "2026-03-01",
      notes: String(r.notes ?? ""),
      preferredStylistId: asText(r.preferred_stylist_id),
    })),
    payments: payments.map((r) => ({
      id: String(r.id),
      bookingId: String(r.booking_id),
      customerId: String(r.customer_id),
      customerName: String(r.customer_name),
      amount: Number(r.amount),
      method: (r.method as "mpesa" | "airtel" | "tigo") ?? "mpesa",
      status: String(r.status) as never,
      orderId: asText(r.order_id),
      phone: String(r.phone),
      description: String(r.description ?? ""),
      createdAt: asText(r.created_at) ?? new Date().toISOString(),
      completedAt: asText(r.completed_at),
      kind: (r.kind as "deposit" | "balance" | "full") ?? "deposit",
    })),
    queue: queue.map((r) => ({
      id: String(r.id),
      appointmentId: String(r.appointment_id),
      position: Number(r.position),
      status: String(r.status) as never,
      arrivedAt: asText(r.arrived_at) ?? new Date().toISOString(),
      startedAt: asText(r.started_at),
      completedAt: asText(r.completed_at),
    })),
    notices: notices.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      body: String(r.body),
      time: asText(r.created_at) ?? new Date().toISOString(),
      read: Boolean(r.read),
      appointmentId: asText(r.appointment_id),
      audience: String(r.audience) as never,
    })),
    reviews: reviews.map((r) => ({
      id: String(r.id),
      appointmentId: String(r.appointment_id),
      customerName: String(r.customer_name),
      serviceId: String(r.service_id),
      stylistId: String(r.stylist_id),
      rating: Number(r.rating),
      quote: String(r.quote),
      published: Boolean(r.published),
      createdAt: asText(r.created_at) ?? new Date().toISOString(),
    })),
    audit: audit.map((r) => ({
      id: String(r.id),
      actor: String(r.actor),
      action: String(r.action),
      target: String(r.target),
      before: asText(r.before_value),
      after: asText(r.after_value),
      at: asText(r.created_at) ?? new Date().toISOString(),
    })),
  };
});

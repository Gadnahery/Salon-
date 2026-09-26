import type { Appointment, AuditEvent, CustomerRecord, Notice, PaymentRecord, QueueEntry, ReviewRecord } from "./types";

function fire(fn: () => Promise<unknown>) {
  void fn().catch(() => {
    /* Preview DB / remote schema may still be booting; local store remains source of truth. */
  });
}

export async function syncBooking(appt: Appointment, payment?: PaymentRecord | null) {
  try {
    const { upsertAppointmentFn, upsertPaymentFn } = await import("./sync-actions");
    await upsertAppointmentFn({
      data: {
        id: appt.id,
        serviceId: appt.serviceId,
        stylistId: appt.stylistId,
        anyStylist: appt.anyStylist,
        date: appt.date,
        time: appt.time,
        style: appt.style,
        notes: appt.notes,
        total: appt.total,
        deposit: appt.deposit,
        remaining: appt.remaining,
        paymentMethod: appt.paymentMethod,
        status: appt.status,
        source: appt.source,
        customerId: appt.customerId,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        paymentOrderId: appt.paymentOrderId,
        checkedInAt: appt.checkedInAt,
        startedAt: appt.startedAt,
        completedAt: appt.completedAt,
      },
    });
    if (payment) {
      await upsertPaymentFn({
        data: {
          id: payment.id,
          bookingId: payment.bookingId,
          customerId: payment.customerId,
          customerName: payment.customerName,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          orderId: payment.orderId,
          phone: payment.phone,
          description: payment.description,
          kind: payment.kind,
        },
      });
    }
  } catch {
    /* ignore */
  }
}

export function syncAppointment(appt: Appointment, payment?: PaymentRecord | null) {
  fire(() => syncBooking(appt, payment));
}

export function syncCustomer(c: CustomerRecord) {
  fire(async () => {
    const { upsertCustomerFn } = await import("./sync-actions");
    await upsertCustomerFn({
      data: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        since: c.since,
        notes: c.notes,
        preferredStylistId: c.preferredStylistId,
      },
    });
  });
}

export function syncNotices(notices: Notice[]) {
  fire(async () => {
    const { upsertNoticeFn } = await import("./sync-actions");
    await Promise.all(
      notices.slice(0, 4).map((n) =>
        upsertNoticeFn({
          data: {
            id: n.id,
            title: n.title,
            body: n.body,
            audience: n.audience,
            appointmentId: n.appointmentId,
          },
        }),
      ),
    );
  });
}

export function syncQueue(entries: QueueEntry[]) {
  fire(async () => {
    const { upsertQueueFn } = await import("./sync-actions");
    await Promise.all(
      entries.map((q) =>
        upsertQueueFn({
          data: {
            id: q.id,
            appointmentId: q.appointmentId,
            position: q.position,
            status: q.status,
            arrivedAt: q.arrivedAt,
            startedAt: q.startedAt,
            completedAt: q.completedAt,
          },
        }),
      ),
    );
  });
}

export function syncAudit(event: AuditEvent) {
  fire(async () => {
    const { upsertAuditFn } = await import("./sync-actions");
    await upsertAuditFn({
      data: {
        id: event.id,
        actor: event.actor,
        action: event.action,
        target: event.target,
        before: event.before,
        after: event.after,
      },
    });
  });
}

export function syncReview(review: ReviewRecord) {
  fire(async () => {
    const { upsertReviewFn } = await import("./sync-actions");
    await upsertReviewFn({
      data: {
        id: review.id,
        appointmentId: review.appointmentId,
        customerName: review.customerName,
        serviceId: review.serviceId,
        stylistId: review.stylistId,
        rating: review.rating,
        quote: review.quote,
        published: review.published,
      },
    });
  });
}

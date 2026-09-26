import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseISO } from "date-fns";
import { getService, SALON, setLiveServices, setLiveTeam, services as catalogSeed, team as teamSeed, gallery as gallerySeed } from "./data";
import { nextBookingId } from "./format";
import {
  applyEvent,
  assignFreeStylist,
  makeAudit,
  makeNotice,
  makePayment,
  moveWaiting,
  quote,
  rebuildQueue,
} from "@/lib/engines";
import {
  CUSTOMER_ID,
  defaultProfile,
  seedAppointments,
  seedAudit,
  seedCustomers,
  seedNotices,
  seedOffers,
  seedPayments,
  seedReviews,
} from "./seed";
import { syncAppointment, syncAudit, syncCustomer, syncNotices, syncQueue as persistQueue, syncReview } from "./sync";
import { pushServiceToSupabase, deleteServiceFromSupabase, pushStaffToSupabase, pushOfferToSupabase } from "./remote";
import type {
  Appointment,
  AppointmentStatus,
  AuditEvent,
  BookingDraft,
  CustomerRecord,
  GalleryItem,
  Notice,
  NoticeTemplate,
  OfferRecord,
  PaymentMethod,
  PaymentRecord,
  Profile,
  QueueEntry,
  ReviewRecord,
  SalonSettings,
  Service,
  Session,
  ShiftStatus,
  StaffRole,
  TeamMember,
  TimeOff,
} from "./types";

const emptyDraft: BookingDraft = {
  serviceId: null,
  stylistId: "any",
  date: null,
  time: null,
  style: "",
  notes: "",
  sensitivities: [],
  photoName: "",
  photoData: "",
  paymentMethod: "mpesa",
};

const defaultSession: Session = {
  portal: "customer",
  actorId: CUSTOMER_ID,
  name: "Gadna Henry",
  role: "customer",
};

const defaultSettings: SalonSettings = {
  name: SALON.name,
  phone: SALON.phone,
  addressLine1: SALON.addressLine1,
  addressLine2: SALON.addressLine2,
  hours: SALON.hours,
  leadMinutes: 30,
  depositPercentDefault: 50,
  cancellationHours: 24,
  mpesaEnabled: true,
  airtelEnabled: true,
  tigoEnabled: true,
  cashierCanDiscount: true,
  maxDiscountPercent: 15,
};

const defaultTemplates: NoticeTemplate[] = [
  { id: "tpl-confirm", title: "Booking confirmation", body: "Your appointment has been confirmed." },
  { id: "tpl-reminder", title: "Reminder", body: "Your appointment is tomorrow at {{time}}." },
  { id: "tpl-cancel", title: "Cancellation", body: "Your appointment has been cancelled." },
  { id: "tpl-payment", title: "Payment", body: "Your payment has been received." },
  { id: "tpl-ready", title: "Stylist ready", body: "Your stylist is ready for you." },
  { id: "tpl-complete", title: "Completed", body: "Thanks for visiting Salon. We'd love a review." },
];

function defaultGallery(): GalleryItem[] {
  return gallerySeed.map((g, i) => ({
    id: `gal-${i}`,
    src: g.src,
    alt: g.alt,
    category: g.category,
    visible: true,
    order: i,
  }));
}

type SalonState = {
  seeded: boolean;
  session: Session;
  profile: Profile;
  customers: CustomerRecord[];
  appointments: Appointment[];
  queue: QueueEntry[];
  payments: PaymentRecord[];
  savedServiceIds: string[];
  notices: Notice[];
  reviews: ReviewRecord[];
  offers: OfferRecord[];
  audit: AuditEvent[];
  staffStatus: Record<string, ShiftStatus>;
  catalog: Service[];
  team: TeamMember[];
  timeOff: TimeOff[];
  settings: SalonSettings;
  templates: NoticeTemplate[];
  galleryItems: GalleryItem[];
  bookingCounter: number;
  draft: BookingDraft;
  toast: string | null;
  lastCompletedId: string | null;
  seedIfNeeded: () => void;
  enterAs: (session: Session) => void;
  setStaffStatus: (id: string, status: ShiftStatus) => void;
  setProfile: (p: Partial<Profile>) => void;
  setDraft: (p: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  toggleSaved: (id: string) => void;
  holdBooking: () => Appointment | null;
  confirmHeld: (id: string, orderId?: string) => Appointment | null;
  expireHeld: (id: string) => void;
  attachPaymentOrder: (id: string, orderId: string) => void;
  confirmBooking: (opts?: { paymentOrderId?: string }) => Appointment | null;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  reschedule: (id: string, date: string, time: string) => boolean;
  cancelAppointment: (id: string) => void;
  checkIn: (id: string) => boolean;
  startService: (id: string) => boolean;
  completeService: (id: string) => boolean;
  markNoShow: (id: string) => boolean;
  assignStylist: (id: string, stylistId: string) => void;
  addWalkIn: (input: {
    customerId?: string;
    name: string;
    phone: string;
    serviceId: string;
    stylistId: string;
    payment: "deposit" | "now" | "later";
    method: PaymentMethod;
  }) => Appointment | null;
  upsertCustomer: (c: Partial<CustomerRecord> & { name: string; phone: string }) => CustomerRecord;
  addCustomerNote: (id: string, note: string) => void;
  collectBalance: (id: string, orderId?: string) => boolean;
  applyDiscount: (id: string, percent: number, reason?: string) => boolean;
  markNoticesRead: (audience?: Notice["audience"]) => void;
  addNotice: (n: Omit<Notice, "id" | "time" | "read">) => void;
  setToast: (msg: string | null) => void;
  publishReview: (id: string, published: boolean) => void;
  submitReview: (input: { appointmentId: string; rating: number; quote: string }) => boolean;
  toggleOffer: (id: string, active: boolean) => void;
  addOffer: (o: Omit<OfferRecord, "id">) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  addService: (service: Service) => void;
  removeService: (id: string) => void;
  updateSettings: (patch: Partial<SalonSettings>) => void;
  updateTemplate: (id: string, patch: Partial<NoticeTemplate>) => void;
  setGalleryVisible: (id: string, visible: boolean) => void;
  reorderQueue: (appointmentId: string, dir: -1 | 1) => void;
  addTimeOff: (staffId: string, date: string, reason: string) => void;
  removeTimeOff: (id: string) => void;
  updateStaffHours: (id: string, hours: TeamMember["hours"]) => void;
  addStaff: (member: TeamMember) => void;
  verifyPayment: (id: string) => void;
  refundPayment: (id: string) => void;
};

function persistOps(opts: {
  appointment?: Appointment | null;
  payment?: PaymentRecord | null;
  customer?: CustomerRecord | null;
  notices?: Notice[];
  audit?: AuditEvent | null;
  queue?: QueueEntry[];
}) {
  if (opts.appointment) syncAppointment(opts.appointment, opts.payment);
  if (opts.customer) syncCustomer(opts.customer);
  if (opts.notices?.length) syncNotices(opts.notices);
  if (opts.audit) syncAudit(opts.audit);
  if (opts.queue) persistQueue(opts.queue);
}

function actorName(session: Session) {
  return session.name;
}

function syncQueue(appointments: Appointment[], queue: QueueEntry[]) {
  return rebuildQueue(appointments, queue);
}

function applyLive(catalog: Service[], team: TeamMember[]) {
  setLiveServices(catalog);
  setLiveTeam(team);
}

export const useSalonStore = create<SalonState>()(
  persist(
    (set, get) => ({
      seeded: false,
      session: defaultSession,
      profile: defaultProfile,
      customers: [],
      appointments: [],
      queue: [],
      payments: [],
      savedServiceIds: ["hair-braiding", "gel-manicure"],
      notices: [],
      reviews: [],
      offers: [],
      audit: [],
      staffStatus: { amina: "available", sarah: "available", grace: "busy", zahra: "available", lewis: "available" },
      catalog: catalogSeed,
      team: teamSeed,
      timeOff: [],
      settings: defaultSettings,
      templates: defaultTemplates,
      galleryItems: defaultGallery(),
      bookingCounter: 48310,
      draft: emptyDraft,
      toast: null,
      lastCompletedId: null,
      seedIfNeeded: () => {
        const state = get();
        const catalog = state.catalog.length ? state.catalog : catalogSeed;
        const team = state.team.length ? state.team : teamSeed;
        applyLive(catalog, team);
        if (state.seeded) {
          if (catalog !== state.catalog) set({ catalog });
          return;
        }
        const appointments = seedAppointments();
        applyLive(catalog, team);
        set({
          appointments,
          customers: seedCustomers(),
          notices: seedNotices(),
          payments: seedPayments(appointments),
          reviews: seedReviews(),
          offers: seedOffers(),
          audit: seedAudit(),
          queue: rebuildQueue(appointments, []),
          catalog,
          team,
          galleryItems: defaultGallery(),
          templates: defaultTemplates,
          settings: defaultSettings,
          bookingCounter: 48310,
          seeded: true,
        });
        const next = get();
        for (const c of next.customers) persistOps({ customer: c });
        for (const a of next.appointments.slice(0, 20)) persistOps({ appointment: a });
        persistOps({ queue: next.queue, notices: next.notices.slice(0, 8) });
      },
      enterAs: (session) => set({ session }),
      setStaffStatus: (id, status) =>
        set({ staffStatus: { ...get().staffStatus, [id]: status } }),
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setDraft: (p) => set({ draft: { ...get().draft, ...p } }),
      resetDraft: () => set({ draft: emptyDraft }),
      toggleSaved: (id) => {
        const cur = get().savedServiceIds;
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        set({
          savedServiceIds: next,
          toast: next.includes(id) ? "Saved to your favorites" : "Removed from favorites",
        });
      },
      holdBooking: () => {
        const { draft, bookingCounter, profile, timeOff } = get();
        if (!draft.serviceId || !draft.date || !draft.time) return null;
        const service = getService(draft.serviceId);
        if (!service) return null;
        const anyStylist = draft.stylistId === "any";
        const stylistId = anyStylist
          ? assignFreeStylist({
              date: draft.date,
              time: draft.time,
              serviceId: draft.serviceId,
              appointments: get().appointments,
              timeOff,
            })
          : draft.stylistId;
        const { total, deposit, remaining } = quote(draft.serviceId, { offers: get().offers });
        const id = nextBookingId(bookingCounter);
        const appt: Appointment = {
          id,
          serviceId: draft.serviceId,
          stylistId,
          anyStylist,
          date: draft.date,
          time: draft.time,
          style: draft.style,
          notes: draft.notes,
          sensitivities: draft.sensitivities,
          photoName: draft.photoName,
          photoData: draft.photoData || undefined,
          total,
          deposit,
          remaining,
          paymentMethod: draft.paymentMethod,
          status: "payment_pending",
          createdAt: new Date().toISOString(),
          customerId: CUSTOMER_ID,
          customerName: profile.name,
          customerPhone: profile.phone,
          source: "appointment",
        };
        const payment = makePayment({
          bookingId: id,
          customerId: CUSTOMER_ID,
          customerName: profile.name,
          amount: deposit,
          method: draft.paymentMethod,
          phone: profile.mpesaPhone || profile.phone,
          description: `Deposit ${id}`,
          kind: "deposit",
          status: "pending",
        });
        set({
          appointments: [appt, ...get().appointments],
          payments: [payment, ...get().payments],
          bookingCounter: bookingCounter + 1,
        });
        persistOps({ appointment: appt, payment });
        return appt;
      },
      confirmHeld: (id, orderId) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return null;
        const next = current.status === "payment_pending" ? applyEvent(current, "pay_success") : { ...current };
        if (!next) return null;
        const confirmed: Appointment = { ...next, paymentOrderId: orderId ?? current.paymentOrderId };
        const appointments = get().appointments.map((a) => (a.id === id ? confirmed : a));
        const payments = get().payments.map((p) =>
          p.bookingId === id && p.status === "pending"
            ? { ...p, status: "paid" as const, orderId: orderId ?? p.orderId, completedAt: new Date().toISOString() }
            : p,
        );
        const paid = payments.find((p) => p.bookingId === id);
        const service = getService(confirmed.serviceId);
        const notices = [
          makeNotice(
            "You're booked",
            `${service?.name ?? "Your service"} is confirmed. We'll see you at your scheduled time.`,
            "customer",
            id,
          ),
          makeNotice(
            "New booking",
            `${confirmed.customerName} booked ${service?.name ?? "a service"} for ${confirmed.time}.`,
            "staff",
            id,
          ),
          makeNotice("New booking", `${confirmed.customerName} booked ${service?.name}.`, "admin", id),
        ];
        const audit = makeAudit(confirmed.customerName, "confirmed booking", id, "payment_pending", "confirmed");
        set({
          appointments,
          payments,
          notices: [...notices, ...get().notices],
          audit: [audit, ...get().audit],
          draft: emptyDraft,
          queue: syncQueue(appointments, get().queue),
        });
        persistOps({ appointment: confirmed, payment: paid, notices, audit });
        return confirmed;
      },
      expireHeld: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return;
        const next = applyEvent(current, "expire") ?? { ...current, status: "expired" as const };
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        const payments = get().payments.map((p) =>
          p.bookingId === id && p.status === "pending" ? { ...p, status: "failed" as const } : p,
        );
        set({ appointments, payments, queue: syncQueue(appointments, get().queue) });
        persistOps({ appointment: next });
      },
      attachPaymentOrder: (id, orderId) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return;
        const next = { ...current, paymentOrderId: orderId };
        const payments = get().payments.map((p) =>
          p.bookingId === id && p.status === "pending" ? { ...p, orderId } : p,
        );
        set({
          appointments: get().appointments.map((a) => (a.id === id ? next : a)),
          payments,
        });
        persistOps({ appointment: next, payment: payments.find((p) => p.bookingId === id) });
      },
      confirmBooking: (opts) => {
        const { draft, bookingCounter, profile, timeOff } = get();
        if (!draft.serviceId || !draft.date || !draft.time) return null;
        const service = getService(draft.serviceId);
        if (!service) return null;
        const anyStylist = draft.stylistId === "any";
        const stylistId = anyStylist
          ? assignFreeStylist({
              date: draft.date,
              time: draft.time,
              serviceId: draft.serviceId,
              appointments: get().appointments,
              timeOff,
            })
          : draft.stylistId;
        const { total, deposit, remaining } = quote(draft.serviceId, { offers: get().offers });
        const id = nextBookingId(bookingCounter);
        const appt: Appointment = {
          id,
          serviceId: draft.serviceId,
          stylistId,
          anyStylist,
          date: draft.date,
          time: draft.time,
          style: draft.style,
          notes: draft.notes,
          sensitivities: draft.sensitivities,
          photoName: draft.photoName,
          photoData: draft.photoData || undefined,
          total,
          deposit,
          remaining,
          paymentMethod: draft.paymentMethod,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          customerId: CUSTOMER_ID,
          customerName: profile.name,
          customerPhone: profile.phone,
          source: "appointment",
          paymentOrderId: opts?.paymentOrderId,
        };
        const payment = makePayment({
          bookingId: id,
          customerId: CUSTOMER_ID,
          customerName: profile.name,
          amount: deposit,
          method: draft.paymentMethod,
          phone: profile.mpesaPhone || profile.phone,
          description: `Deposit ${id}`,
          kind: "deposit",
          status: "paid",
          orderId: opts?.paymentOrderId,
        });
        set({
          appointments: [appt, ...get().appointments],
          payments: [payment, ...get().payments],
          notices: [
            makeNotice("You're booked", `${service.name} is confirmed. We'll see you at your scheduled time.`, "customer", id),
            makeNotice("New booking", `${profile.name} booked ${service.name} for ${draft.time}.`, "staff", id),
            makeNotice("New booking", `${profile.name} booked ${service.name}.`, "admin", id),
            ...get().notices,
          ],
          audit: [makeAudit(profile.name, "created booking", id, undefined, "confirmed"), ...get().audit],
          bookingCounter: bookingCounter + 1,
          draft: emptyDraft,
          queue: syncQueue([appt, ...get().appointments], get().queue),
        });
        persistOps({ appointment: appt, payment, notices: [makeNotice("You're booked", `${service.name} is confirmed. We'll see you at your scheduled time.`, "customer", id)] });
        return appt;
      },
      setAppointmentStatus: (id, status) => {
        const map: Record<AppointmentStatus, Parameters<typeof applyEvent>[1] | null> = {
          payment_pending: null,
          confirmed: "pay_success",
          checked_in: "check_in",
          in_service: "start",
          completed: "complete",
          cancelled: "cancel",
          no_show: "no_show",
          expired: "expire",
        };
        const event = map[status];
        if (!event) return;
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return;
        const next = applyEvent(current, event);
        if (!next) return;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        set({ appointments, queue: syncQueue(appointments, get().queue) });
      },
      reschedule: (id, date, time) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        const appointments = get().appointments.map((a) =>
          a.id === id
            ? { ...a, date, time, status: (a.status === "cancelled" ? a.status : "confirmed") as AppointmentStatus }
            : a,
        );
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          notices: [
            makeNotice("Appointment updated", "Your appointment time has been changed.", "customer", id),
            makeNotice("Booking rescheduled", `${current.customerName} moved to ${time}.`, "staff", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "rescheduled booking", id, `${current.date} ${current.time}`, `${date} ${time}`), ...get().audit],
        });
        persistOps({
          appointment: get().appointments.find((a) => a.id === id),
          notices: get().notices.slice(0, 2),
          audit: get().audit[0],
        });
        return true;
      },
      cancelAppointment: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return;
        const next = applyEvent(current, "cancel");
        if (!next) return;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          notices: [
            makeNotice("Appointment cancelled", "This appointment has been cancelled.", "customer", id),
            makeNotice("Booking cancelled", `${current.customerName} cancelled ${current.time}.`, "staff", id),
            makeNotice("Appointment cancellation", `${current.customerName} cancelled.`, "admin", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "cancelled booking", id, current.status, "cancelled"), ...get().audit],
        });
        persistOps({
          appointment: next,
          notices: get().notices.slice(0, 3),
          audit: get().audit[0],
          queue: get().queue,
        });
      },
      checkIn: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        const next = applyEvent(current, "check_in");
        if (!next) return false;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          notices: [
            makeNotice("You're checked in", "Your stylist will take care of you shortly.", "customer", id),
            makeNotice("Customer checked in", `${current.customerName} has arrived.`, "staff", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "checked in", id, current.status, "checked_in"), ...get().audit],
          toast: `${current.customerName} is checked in`,
        });
        persistOps({
          appointment: next,
          notices: get().notices.slice(0, 2),
          audit: get().audit[0],
          queue: get().queue,
        });
        return true;
      },
      startService: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        let working = current;
        if (working.status === "confirmed") {
          const checked = applyEvent(working, "check_in");
          if (checked) working = checked;
        }
        const next = applyEvent(working, "start");
        if (!next) return false;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        const stylistId = next.stylistId === "any" ? get().session.actorId : next.stylistId;
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          staffStatus: { ...get().staffStatus, [stylistId]: "busy" },
          notices: [
            makeNotice("Your stylist is ready", "Your appointment is starting now.", "customer", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "started service", id, current.status, "in_service"), ...get().audit],
        });
        persistOps({ appointment: next, queue: get().queue, audit: get().audit[0] });
        return true;
      },
      completeService: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        const next = applyEvent(current, "complete");
        if (!next) return false;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        const stylistId = next.stylistId === "any" ? get().session.actorId : next.stylistId;
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          staffStatus: { ...get().staffStatus, [stylistId]: "available" },
          lastCompletedId: id,
          notices: [
            makeNotice("Thanks for visiting", "Your appointment is complete. We'd love a review when you're ready.", "customer", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "completed service", id, current.status, "completed"), ...get().audit],
          toast: "Service completed",
        });
        persistOps({ appointment: next, queue: get().queue, audit: get().audit[0] });
        return true;
      },
      markNoShow: (id) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        const next = applyEvent(current, "no_show");
        if (!next) return false;
        const appointments = get().appointments.map((a) => (a.id === id ? next : a));
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          audit: [makeAudit(actorName(get().session), "marked no-show", id, current.status, "no_show"), ...get().audit],
        });
        persistOps({ appointment: next, queue: get().queue, audit: get().audit[0] });
        return true;
      },
      assignStylist: (id, stylistId) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return;
        const appointments = get().appointments.map((a) =>
          a.id === id ? { ...a, stylistId, anyStylist: false } : a,
        );
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          audit: [makeAudit(actorName(get().session), "assigned stylist", id, current.stylistId, stylistId), ...get().audit],
        });
      },
      upsertCustomer: (c) => {
        const existing = get().customers.find(
          (x) => x.id === c.id || x.phone.replace(/\s/g, "") === c.phone.replace(/\s/g, ""),
        );
        if (existing) {
          const next = { ...existing, ...c, id: existing.id };
          set({ customers: get().customers.map((x) => (x.id === existing.id ? next : x)) });
          persistOps({ customer: next });
          return next;
        }
        const created: CustomerRecord = {
          id: `cust-${Date.now()}`,
          name: c.name,
          phone: c.phone,
          since: new Date().toISOString().slice(0, 10),
          notes: c.notes ?? "",
          preferredStylistId: c.preferredStylistId,
        };
        set({ customers: [created, ...get().customers] });
        persistOps({ customer: created });
        return created;
      },
      addCustomerNote: (id, note) => {
        set({
          customers: get().customers.map((c) =>
            c.id === id ? { ...c, notes: c.notes ? `${c.notes}\n${note}` : note } : c,
          ),
          audit: [makeAudit(actorName(get().session), "added customer note", id), ...get().audit],
        });
      },
      addWalkIn: (input) => {
        const customer = get().upsertCustomer({
          id: input.customerId,
          name: input.name,
          phone: input.phone,
        });
        const service = getService(input.serviceId);
        if (!service) return null;
        const priced = quote(input.serviceId, { offers: get().offers });
        const deposit = input.payment === "later" ? 0 : input.payment === "now" ? priced.total : priced.deposit;
        const remaining = Math.max(0, priced.total - deposit);
        const id = nextBookingId(get().bookingCounter);
        const now = new Date();
        const hh = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const stylistId =
          input.stylistId === "any"
            ? assignFreeStylist({
                date: now.toISOString().slice(0, 10),
                time: hh,
                serviceId: input.serviceId,
                appointments: get().appointments,
                timeOff: get().timeOff,
              })
            : input.stylistId;
        const appt: Appointment = {
          id,
          serviceId: input.serviceId,
          stylistId,
          anyStylist: input.stylistId === "any",
          date: now.toISOString().slice(0, 10),
          time: hh,
          style: "",
          notes: "",
          sensitivities: [],
          photoName: "",
          total: priced.total,
          deposit,
          remaining,
          paymentMethod: input.method,
          status: "checked_in",
          createdAt: now.toISOString(),
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          source: "walk_in",
          checkedInAt: now.toISOString(),
        };
        const appointments = [appt, ...get().appointments];
        const payment =
          deposit > 0
            ? makePayment({
                bookingId: id,
                customerId: customer.id,
                customerName: customer.name,
                amount: deposit,
                method: input.method,
                phone: customer.phone,
                description: input.payment === "now" ? `Walk-in ${id}` : `Walk-in deposit ${id}`,
                kind: input.payment === "now" ? "full" : "deposit",
                status: "paid",
              })
            : null;
        set({
          appointments,
          queue: syncQueue(appointments, get().queue),
          payments: payment ? [payment, ...get().payments] : get().payments,
          bookingCounter: get().bookingCounter + 1,
          notices: [
            makeNotice("Walk-in added", `${customer.name} was added to the queue.`, "staff", id),
            makeNotice("Walk-in added", `${customer.name} joined the queue.`, "admin", id),
            ...get().notices,
          ],
          audit: [makeAudit(actorName(get().session), "added walk-in", id), ...get().audit],
          toast: `${customer.name} added to the queue`,
        });
        persistOps({
          appointment: appt,
          payment,
          customer,
          queue: get().queue,
          audit: get().audit[0],
        });
        return appt;
      },

      applyDiscount: (id, percent, reason) => {
        const settings = get().settings;
        if (!settings.cashierCanDiscount) {
          set({ toast: "Discounts are disabled by admin" });
          return false;
        }
        const max = settings.maxDiscountPercent ?? 0;
        const pct = Math.max(0, Math.min(max, Math.round(percent)));
        const current = get().appointments.find((a) => a.id === id);
        if (!current) return false;
        if (current.remaining <= 0 && current.status !== "payment_pending") {
          set({ toast: "Nothing left to discount" });
          return false;
        }
        const baseTotal = current.total;
        const newTotal = Math.round(baseTotal * (1 - pct / 100));
        const paid = Math.max(0, baseTotal - current.remaining);
        const newRemaining = Math.max(0, newTotal - paid);
        const appointments = get().appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                total: newTotal,
                remaining: newRemaining,
                deposit: Math.min(a.deposit, newTotal),
                discountPercent: pct,
                discountReason: reason ?? "",
              }
            : a,
        );
        set({
          appointments,
          audit: [
            makeAudit(
              actorName(get().session),
              "applied discount",
              id,
              `${current.total}`,
              `${newTotal} (-${pct}%)`,
            ),
            ...get().audit,
          ],
          toast: pct ? `${pct}% discount applied` : "Discount cleared",
        });
        persistOps({ appointment: appointments.find((a) => a.id === id), audit: get().audit[0] });
        return true;
      },

      collectBalance: (id, orderId) => {
        const current = get().appointments.find((a) => a.id === id);
        if (!current || current.remaining <= 0) return false;
        const payment = makePayment({
          bookingId: id,
          customerId: current.customerId,
          customerName: current.customerName,
          amount: current.remaining,
          method: current.paymentMethod,
          phone: current.customerPhone,
          description: `Balance ${id}`,
          kind: "balance",
          status: "paid",
          orderId,
        });
        set({
          appointments: get().appointments.map((a) => (a.id === id ? { ...a, remaining: 0, deposit: a.total } : a)),
          payments: [payment, ...get().payments],
          toast: "Balance collected",
          audit: [makeAudit(actorName(get().session), "collected balance", id), ...get().audit],
        });
        persistOps({
          appointment: get().appointments.find((a) => a.id === id),
          payment,
          audit: get().audit[0],
        });
        return true;
      },
      markNoticesRead: (audience) =>
        set({
          notices: get().notices.map((n) =>
            !audience || n.audience === audience ? { ...n, read: true } : n,
          ),
        }),
      addNotice: (n) =>
        set({
          notices: [makeNotice(n.title, n.body, n.audience, n.appointmentId), ...get().notices],
        }),
      setToast: (msg) => set({ toast: msg }),
      publishReview: (id, published) =>
        set({
          reviews: get().reviews.map((r) => (r.id === id ? { ...r, published } : r)),
          audit: [makeAudit(actorName(get().session), published ? "published review" : "hid review", id), ...get().audit],
        }),
      submitReview: (input) => {
        const appt = get().appointments.find((a) => a.id === input.appointmentId);
        if (!appt || appt.status !== "completed") return false;
        if (get().reviews.some((r) => r.appointmentId === input.appointmentId)) return false;
        const review: ReviewRecord = {
          id: `rev-${Date.now()}`,
          appointmentId: appt.id,
          customerName: appt.customerName,
          serviceId: appt.serviceId,
          stylistId: appt.stylistId,
          rating: input.rating,
          quote: input.quote,
          published: false,
          createdAt: new Date().toISOString(),
        };
        set({
          reviews: [review, ...get().reviews],
          notices: [makeNotice("New review", `${appt.customerName} left a review.`, "admin", appt.id), ...get().notices],
          toast: "Thank you for the review",
        });
        syncReview(review);
        return true;
      },
      toggleOffer: (id, active) =>
        set({
          offers: get().offers.map((o) => {
            const next = o.id === id ? { ...o, active } : o;
            if (o.id === id) void pushOfferToSupabase(next);
            return next;
          }),
        }),
      addOffer: (o) =>
        set({
          offers: (() => {
            const row = { ...o, id: `off-${Date.now()}` };
            void pushOfferToSupabase(row);
            return [row, ...get().offers];
          })(),
          audit: [makeAudit(actorName(get().session), "created offer", o.title), ...get().audit],
        }),
      updateService: (id, patch) => {
        const catalog = get().catalog.map((s) => (s.id === id ? { ...s, ...patch } : s));
        applyLive(catalog, get().team);
        set({
          catalog,
          audit: [makeAudit(actorName(get().session), "updated service", id), ...get().audit],
          toast: "Service saved",
        });
        const saved = catalog.find((s) => s.id === id);
        if (saved) void pushServiceToSupabase(saved);
      },
      addService: (service) => {
        const catalog = [service, ...get().catalog];
        applyLive(catalog, get().team);
        set({
          catalog,
          audit: [makeAudit(actorName(get().session), "created service", service.id), ...get().audit],
          toast: `${service.name} added`,
        });
        void pushServiceToSupabase(service);
      },
      removeService: (id) => {
        const catalog = get().catalog.filter((s) => s.id !== id);
        applyLive(catalog, get().team);
        set({
          catalog,
          audit: [makeAudit(actorName(get().session), "removed service", id), ...get().audit],
          toast: "Service removed",
        });
        void deleteServiceFromSupabase(id);
      },
      updateSettings: (patch) =>
        set({
          settings: { ...get().settings, ...patch },
          audit: [makeAudit(actorName(get().session), "updated settings", "salon"), ...get().audit],
          toast: "Settings saved",
        }),
      updateTemplate: (id, patch) =>
        set({
          templates: get().templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          toast: "Template saved",
        }),
      setGalleryVisible: (id, visible) =>
        set({
          galleryItems: get().galleryItems.map((g) => (g.id === id ? { ...g, visible } : g)),
        }),
      reorderQueue: (appointmentId, dir) => {
        set({ queue: moveWaiting(get().queue, appointmentId, dir) });
      },
      addTimeOff: (staffId, date, reason) =>
        set({
          timeOff: [{ id: `off-${Date.now()}`, staffId, date, reason }, ...get().timeOff],
          audit: [makeAudit(actorName(get().session), "added time off", staffId, undefined, date), ...get().audit],
        }),
      removeTimeOff: (id) => set({ timeOff: get().timeOff.filter((t) => t.id !== id) }),
      updateStaffHours: (id, hours) => {
        const team = get().team.map((m) => (m.id === id ? { ...m, hours } : m));
        applyLive(get().catalog, team);
        set({ team, audit: [makeAudit(actorName(get().session), "updated hours", id), ...get().audit] });
      },
      addStaff: (member) => {
        const team = [member, ...get().team];
        applyLive(get().catalog, team);
        set({
          team,
          staffStatus: { ...get().staffStatus, [member.id]: "available" },
          audit: [makeAudit(actorName(get().session), "added staff", member.id), ...get().audit],
          toast: `${member.name} added`,
        });
        void pushStaffToSupabase(member);
      },
      verifyPayment: (id) =>
        set({
          payments: get().payments.map((p) =>
            p.id === id ? { ...p, status: "paid", completedAt: new Date().toISOString() } : p,
          ),
          audit: [makeAudit(actorName(get().session), "verified payment", id), ...get().audit],
          toast: "Payment verified",
        }),
      refundPayment: (id) =>
        set({
          payments: get().payments.map((p) => (p.id === id ? { ...p, status: "refunded" } : p)),
          audit: [makeAudit(actorName(get().session), "refunded payment", id), ...get().audit],
          toast: "Refund recorded",
        }),
    }),
    {
      name: "uls-salon-ops-v4",
      skipHydration: true,
      partialize: (s) => ({
        seeded: s.seeded,
        session: s.session,
        profile: s.profile,
        customers: s.customers,
        appointments: s.appointments,
        queue: s.queue,
        payments: s.payments,
        savedServiceIds: s.savedServiceIds,
        notices: s.notices,
        reviews: s.reviews,
        offers: s.offers,
        audit: s.audit,
        staffStatus: s.staffStatus,
        catalog: s.catalog,
        team: s.team,
        timeOff: s.timeOff,
        settings: s.settings,
        templates: s.templates,
        galleryItems: s.galleryItems,
        bookingCounter: s.bookingCounter,
        draft: s.draft,
      }),
    },
  ),
);

export function useMyAppointments() {
  const appointments = useSalonStore((s) => s.appointments);
  const session = useSalonStore((s) => s.session);
  if (session.portal !== "customer") return appointments;
  return appointments.filter((a) => a.customerId === session.actorId);
}

export function useUpcoming() {
  const appointments = useMyAppointments();
  const now = new Date();
  return appointments
    .filter((a) => a.status !== "cancelled" && a.status !== "completed" && a.status !== "payment_pending" && a.status !== "no_show" && a.status !== "expired")
    .filter((a) => {
      const d = parseISO(`${a.date}T${a.time}:00`);
      return d.getTime() + 4 * 60 * 60 * 1000 >= now.getTime();
    })
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function useStaffAppointments() {
  const appointments = useSalonStore((s) => s.appointments);
  const session = useSalonStore((s) => s.session);
  if (session.role === "stylist") {
    return appointments.filter((a) => a.stylistId === session.actorId || a.anyStylist || a.stylistId === "any");
  }
  return appointments;
}

export function effectiveShift(id: string, appointments: Appointment[], override: ShiftStatus): ShiftStatus {
  if (override === "on_break" || override === "offline") return override;
  const busy = appointments.some((a) => a.stylistId === id && a.status === "in_service");
  return busy ? "busy" : "available";
}

export function isStaffRole(role: Session["role"]): role is StaffRole {
  return role !== "customer";
}

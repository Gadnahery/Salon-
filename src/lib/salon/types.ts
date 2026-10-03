export type Category = "hair" | "nails" | "makeup" | "treatments";

export type Service = {
  id: string;
  name: string;
  category: Category;
  description: string;
  priceMin: number;
  priceMax?: number;
  durationMin: number;
  durationMax?: number;
  rating: number;
  reviewCount: number;
  image: string;
  imagePosition?: string;
  gallery: string[];
  includes: string[];
  popular?: boolean;
  signature?: boolean;
  available?: boolean;
  acceptsReference?: boolean;
  depositPercent: number;
  nextAvailable: string;
  featuredReview: { quote: string; name: string };
};

export type Stylist = {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialties: Category[];
  image?: string;
  initials: string;
  rating: number;
};

export type StaffRole = "stylist" | "receptionist" | "manager" | "admin";
export type ShiftStatus = "available" | "busy" | "on_break" | "offline";
export type Portal = "customer" | "staff" | "admin";

export type TeamMember = Stylist & {
  role: StaffRole;
  phone: string;
  email: string;
  serviceIds: string[];
  hours: { day: number; start: string; end: string; off?: boolean }[];
  breakStart?: string;
  breakEnd?: string;
  active?: boolean;
};

export type PaymentMethod = "mpesa" | "airtel" | "tigo";

export type AppointmentStatus =
  | "requested"
  | "payment_pending"
  | "confirmed"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired";

export type BookingSource = "appointment" | "walk_in";

export type WaitlistEntry = {
  id: string;
  serviceId: string;
  stylistId: string;
  preferredDate: string;
  preferredTime?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  status: "waiting" | "offered" | "accepted" | "declined" | "expired" | "booked" | "cancelled";
  /** When status is offered */
  offeredDate?: string;
  offeredTime?: string;
  offerExpiresAt?: string;
};

export type Appointment = {
  id: string;
  serviceId: string;
  stylistId: string;
  anyStylist: boolean;
  date: string;
  time: string;
  style: string;
  notes: string;
  sensitivities: string[];
  photoName: string;
  photoData?: string;
  total: number;
  deposit: number;
  remaining: number;
  paymentMethod: PaymentMethod;
  status: AppointmentStatus;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  source: BookingSource;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  paymentOrderId?: string;
  discountPercent?: number;
  discountReason?: string;
  /** Provider must confirm before service day */
  needsProviderConfirm?: boolean;
  providerConfirmed?: boolean;
  beforePhoto?: string;
  afterPhoto?: string;
  photoConsent?: boolean;
};

export type NoticeAudience = "customer" | "staff" | "admin";

export type Notice = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  appointmentId?: string;
  audience: NoticeAudience;
};

export type Profile = {
  name: string;
  phone: string;
  mpesaPhone: string;
  reminders: boolean;
  stylistReadyAlerts: boolean;
};

export type BookingDraft = {
  serviceId: string | null;
  stylistId: string;
  date: string | null;
  time: string | null;
  style: string;
  notes: string;
  sensitivities: string[];
  photoName: string;
  photoData: string;
  paymentMethod: PaymentMethod;
};

export type Session = {
  portal: Portal;
  actorId: string;
  name: string;
  role: StaffRole | "customer";
};

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  since: string;
  notes: string;
  preferredStylistId?: string;
  returning?: boolean;
};

export type QueueStatus = "waiting" | "in_service" | "completed" | "no_show" | "removed";

export type QueueEntry = {
  id: string;
  appointmentId: string;
  position: number;
  status: QueueStatus;
  arrivedAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type PaymentStatus = "pending" | "paid" | "partial" | "failed" | "refunded";

export type PaymentRecord = {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  orderId?: string;
  phone: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  kind: "deposit" | "balance" | "full";
};

export type ReviewRecord = {
  id: string;
  appointmentId: string;
  customerName: string;
  serviceId: string;
  stylistId: string;
  rating: number;
  quote: string;
  published: boolean;
  createdAt: string;
};

export type OfferRecord = {
  id: string;
  title: string;
  copy: string;
  serviceId?: string;
  discountPercent: number;
  start: string;
  end: string;
  active: boolean;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  before?: string;
  after?: string;
  at: string;
};

export type TimeOff = {
  id: string;
  staffId: string;
  date: string;
  reason: string;
};

export type NoticeTemplate = {
  id: string;
  title: string;
  body: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  category: "Hair" | "Nails" | "Makeup" | "Salon" | "Team";
  visible: boolean;
  order: number;
};

export type SalonSettings = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  hours: string;
  leadMinutes: number;
  depositPercentDefault: number;
  cancellationHours: number;
  mpesaEnabled: boolean;
  airtelEnabled: boolean;
  tigoEnabled: boolean;
  /** When true, cashier/staff may apply a discount at payment time. */
  cashierCanDiscount: boolean;
  /** Max discount % a cashier may grant without further approval. */
  maxDiscountPercent: number;
};

export type StaffNoticeKind =
  | "new_booking"
  | "checked_in"
  | "cancelled"
  | "walk_in"
  | "payment"
  | "system";

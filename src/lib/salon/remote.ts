import { supabaseSelect, supabaseUpsert, supabaseConfigured } from "./supabase";
import type { Category, OfferRecord, Service, TeamMember, StaffRole } from "./types";

type RemoteService = {
  id: string;
  name: string;
  category: string;
  description?: string;
  price_min: number;
  price_max?: number | null;
  duration_min: number;
  duration_max?: number | null;
  deposit_percent?: number;
  image?: string | null;
  available?: boolean;
};

type RemoteStaff = {
  id: string;
  name: string;
  title: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  service_ids?: string[] | null;
  active?: boolean;
};

type RemoteOffer = {
  id: string;
  title: string;
  copy: string;
  service_id?: string | null;
  discount_percent: number;
  start: string;
  end: string;
  active: boolean;
};

function mapService(r: RemoteService): Service {
  return {
    id: r.id,
    name: r.name,
    category: (r.category as Category) || "hair",
    description: r.description ?? "",
    priceMin: r.price_min,
    priceMax: r.price_max ?? undefined,
    durationMin: r.duration_min,
    durationMax: r.duration_max ?? undefined,
    rating: 4.9,
    reviewCount: 0,
    image: r.image || "/images/braiding.jpg",
    gallery: r.image ? [r.image] : ["/images/braiding.jpg"],
    includes: ["Consultation", "Styling", "Finishing"],
    depositPercent: r.deposit_percent ?? 50,
    nextAvailable: "Today",
    featuredReview: { quote: "", name: "" },
    available: r.available !== false,
  };
}

function mapStaff(r: RemoteStaff): TeamMember {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    bio: "",
    specialties: ["hair"],
    initials: r.name.slice(0, 1).toUpperCase(),
    rating: 4.9,
    role: (r.role as StaffRole) || "stylist",
    phone: r.phone || "",
    email: r.email || "",
    serviceIds: r.service_ids ?? [],
    hours: [
      { day: 1, start: "09:00", end: "19:00" },
      { day: 2, start: "09:00", end: "19:00" },
      { day: 3, start: "09:00", end: "19:00" },
      { day: 4, start: "09:00", end: "19:00" },
      { day: 5, start: "09:00", end: "19:00" },
      { day: 6, start: "09:00", end: "19:00" },
      { day: 0, start: "00:00", end: "00:00", off: true },
    ],
    active: r.active !== false,
  };
}

function mapOffer(r: RemoteOffer): OfferRecord {
  return {
    id: r.id,
    title: r.title,
    copy: r.copy,
    serviceId: r.service_id || undefined,
    discountPercent: r.discount_percent,
    start: r.start,
    end: r.end,
    active: r.active,
  };
}

export async function pullCatalogFromSupabase(): Promise<{
  services: Service[];
  team: TeamMember[];
  offers: OfferRecord[];
}> {
  if (!supabaseConfigured()) return { services: [], team: [], offers: [] };
  const [services, staff, offers] = await Promise.all([
    supabaseSelect<RemoteService>("salon_services", "select=*&order=name"),
    supabaseSelect<RemoteStaff>("salon_staff", "select=*&order=name"),
    supabaseSelect<RemoteOffer>("salon_offers", "select=*&order=start.desc"),
  ]);
  return {
    services: services.map(mapService),
    team: staff.map(mapStaff),
    offers: offers.map(mapOffer),
  };
}

export async function pushServiceToSupabase(s: Service) {
  return supabaseUpsert("salon_services", {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    price_min: s.priceMin,
    price_max: s.priceMax ?? null,
    duration_min: s.durationMin,
    duration_max: s.durationMax ?? null,
    deposit_percent: s.depositPercent,
    image: s.image,
    available: s.available !== false,
  });
}

export async function deleteServiceFromSupabase(id: string) {
  const base =
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_URL : undefined) ||
    "https://xkhcwokuxhhchdhqjbyn.supabase.co";
  const anon =
    (typeof import.meta !== "undefined" ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraGN3b2t1eGhoY2hkaHFqYnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTMyMjAsImV4cCI6MjEwNTkyOTIyMH0.ETrTW4Z9dBoRX76qxmGzPjYBEWntlRjwrNe7puVMhy8";
  try {
    await fetch(`${base}/rest/v1/salon_services?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
  } catch {
    /* ignore */
  }
}

export async function pushStaffToSupabase(m: TeamMember) {
  return supabaseUpsert("salon_staff", {
    id: m.id,
    name: m.name,
    title: m.title,
    role: m.role,
    phone: m.phone,
    email: m.email,
    service_ids: m.serviceIds,
    active: m.active !== false,
  });
}

export async function pushOfferToSupabase(o: OfferRecord) {
  return supabaseUpsert("salon_offers", {
    id: o.id,
    title: o.title,
    copy: o.copy,
    service_id: o.serviceId ?? null,
    discount_percent: o.discountPercent,
    start: o.start,
    end: o.end,
    active: o.active,
  });
}

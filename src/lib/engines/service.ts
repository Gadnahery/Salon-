import { getService } from "@/lib/salon/data";
import type { Category, Service } from "@/lib/salon/types";

export function servicesIn(catalog: Service[], category?: Category) {
  return category ? catalog.filter((s) => s.category === category) : catalog;
}

export function activeServices(catalog: Service[]) {
  return catalog.filter((s) => s.available !== false);
}

export function serviceSummary(id: string) {
  const s = getService(id);
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    priceMin: s.priceMin,
    priceMax: s.priceMax ?? s.priceMin,
    durationMin: s.durationMin,
    durationMax: s.durationMax ?? s.durationMin,
    depositPercent: s.depositPercent,
    staffRequired: true,
  };
}

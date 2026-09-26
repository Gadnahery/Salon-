import type { OfferRecord } from "@/lib/salon/types";

export function activeOfferFor(offers: OfferRecord[], serviceId: string, onDate = new Date().toISOString().slice(0, 10)) {
  return (
    offers.find((o) => {
      if (!o.active) return false;
      if (o.serviceId && o.serviceId !== serviceId) return false;
      if (o.start && onDate < o.start) return false;
      if (o.end && onDate > o.end) return false;
      return o.discountPercent > 0;
    }) ?? null
  );
}

export function applyDiscount(amount: number, offers: OfferRecord[], serviceId: string) {
  const offer = activeOfferFor(offers, serviceId);
  if (!offer) return { amount, discount: 0, offer: null };
  const discount = Math.round(amount * (offer.discountPercent / 100));
  return { amount: Math.max(100, amount - discount), discount, offer };
}

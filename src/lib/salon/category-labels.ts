import type { Category } from "./types";

/** Display labels for Warembo Village. DB values stay: hair | nails | makeup | treatments */
export const CATEGORY_LABELS: Record<Category, string> = {
  treatments: "Hair Clinic",
  hair: "Hair Salon",
  makeup: "Makeup Studio",
  nails: "Nails Spa",
};

export const CATEGORY_ORDER: Category[] = ["treatments", "hair", "makeup", "nails"];

export function categoryLabel(c: Category): string {
  return CATEGORY_LABELS[c] ?? c;
}

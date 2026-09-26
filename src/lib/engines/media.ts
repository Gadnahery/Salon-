import type { GalleryItem } from "@/lib/salon/types";

export function publicGallery(items: GalleryItem[], category?: GalleryItem["category"]) {
  return items
    .filter((i) => i.visible)
    .filter((i) => (category ? i.category === category : true))
    .sort((a, b) => a.order - b.order);
}

export function isPrivateReference(kind: "service" | "gallery" | "reference" | "staff") {
  return kind === "reference";
}

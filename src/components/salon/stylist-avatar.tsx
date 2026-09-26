import { cn } from "@/lib/utils";
import type { Stylist } from "@/lib/salon/types";

export function StylistAvatar({
  stylist,
  size = "md",
  selected,
}: {
  stylist: Pick<Stylist, "name" | "initials" | "image">;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
}) {
  const dim = size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-14";
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-soft text-brand",
        dim,
        selected && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
      )}
    >
      {stylist.image ? (
        <img src={stylist.image} alt={stylist.name} className="size-full object-cover" />
      ) : (
        <span className="text-body font-medium">{stylist.initials}</span>
      )}
    </span>
  );
}

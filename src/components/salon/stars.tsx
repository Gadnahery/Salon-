import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value = 5,
  className,
  light,
}: {
  value?: number;
  className?: string;
  light?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(value)
              ? light
                ? "fill-surface text-surface"
                : "fill-ink text-ink"
              : light
                ? "text-surface/40"
                : "text-line",
          )}
          strokeWidth={1.75}
        />
      ))}
    </span>
  );
}

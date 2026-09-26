import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-line/70", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[skeleton-shimmer_1.4s_linear_infinite] bg-linear-to-r from-transparent via-surface/70 to-transparent" />
    </div>
  );
}

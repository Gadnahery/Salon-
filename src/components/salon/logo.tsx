import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-ink font-display text-sm tracking-tight text-surface",
        className,
      )}
    >
      UL
    </span>
  );
}

export function LogoWord({
  className,
  light,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 font-display text-lg tracking-[0.08em]",
        light ? "text-surface" : "text-ink",
        className,
      )}
    >
      SALON
    </span>
  );
}

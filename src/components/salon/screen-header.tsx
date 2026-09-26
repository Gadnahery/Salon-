import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScreenHeader({
  title,
  backTo,
  action,
  light,
  className,
}: {
  title?: string;
  backTo?: string;
  action?: ReactNode;
  light?: boolean;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-5 pt-4 pb-3",
        light ? "text-surface" : "text-ink",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Back"
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          light && "glass-chip text-ink",
        )}
        onClick={() => {
          if (backTo) router.history.push(backTo);
          else router.history.back();
        }}
      >
        <ChevronLeft className="size-5" strokeWidth={1.75} />
      </button>
      <p className="min-w-0 flex-1 truncate text-center text-body font-medium">{title}</p>
      <div className="flex min-w-11 items-center justify-center">{action}</div>
    </header>
  );
}

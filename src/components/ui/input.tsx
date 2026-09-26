import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-13 w-full rounded-2xl border border-line bg-surface px-4 text-body text-ink",
        "placeholder:text-muted outline-none transition-[border-color,box-shadow] duration-150",
        "focus:border-ink focus:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-body text-ink",
        "placeholder:text-muted outline-none transition-[border-color,box-shadow] duration-150",
        "focus:border-ink focus:shadow-focus resize-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-support font-medium text-muted", className)}
      {...props}
    />
  );
}

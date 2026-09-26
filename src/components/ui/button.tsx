import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,color,box-shadow,border-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus",
  {
    variants: {
      variant: {
        primary: "bg-ink text-surface hover:bg-ink/90",
        secondary: "bg-surface text-ink border border-line hover:bg-bg",
        ghost: "bg-transparent text-ink hover:bg-brand-soft",
        brand: "bg-brand text-surface hover:bg-brand/90",
        inverse: "bg-surface text-ink hover:bg-surface/90",
        quiet: "bg-transparent text-surface/90 hover:text-surface",
        danger: "bg-transparent text-danger hover:bg-brand-soft",
      },
      size: {
        lg: "h-14 rounded-2xl px-6 text-body",
        md: "h-12 rounded-2xl px-5 text-body",
        sm: "h-10 rounded-xl px-4 text-support",
        icon: "size-11 rounded-full",
        pill: "h-10 rounded-full px-4 text-support",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { static?: boolean };

export function Button({
  className,
  variant,
  size,
  static: isStatic,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        isStatic && "active:scale-100",
        className,
      )}
      {...props}
    />
  );
}

export { buttonVariants };

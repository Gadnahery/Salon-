import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,color,box-shadow,border-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus",
  {
    variants: {
      variant: {
        // Use explicit #fff so text never inherits ink/muted from parents
        primary: "bg-ink text-white hover:bg-ink/90 btn-primary-force",
        secondary: "bg-surface text-ink border border-line hover:bg-bg",
        ghost: "bg-transparent text-ink hover:bg-brand-soft",
        brand: "bg-brand text-white hover:bg-brand/90 btn-primary-force",
        inverse: "bg-surface text-ink hover:bg-surface/90",
        quiet: "bg-transparent text-white/90 hover:text-white",
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
  style,
  ...props
}: ButtonProps) {
  const isDark = variant === "primary" || variant === "brand" || variant == null;
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        isStatic && "active:scale-100",
        className,
      )}
      style={
        isDark
          ? { color: "#ffffff", ...style }
          : style
      }
      {...props}
    />
  );
}

export { buttonVariants };

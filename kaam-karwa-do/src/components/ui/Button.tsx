import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-dark active:bg-brand-dark shadow-card",
  secondary:
    "bg-accent text-white hover:bg-accent-dark active:bg-accent-dark shadow-card",
  outline:
    "border border-slate-300 text-ink bg-white hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-ink hover:bg-slate-100 active:bg-slate-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-3 py-2 min-h-[36px]",
  md: "text-base px-4 py-3 min-h-[44px]",
  lg: "text-lg px-6 py-4 min-h-[52px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "touch-manipulation select-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

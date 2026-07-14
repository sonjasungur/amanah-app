import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-emerald text-white hover:bg-primary-hover shadow-md hover:shadow-lg focus-visible:ring-emerald",
  secondary: "bg-primary-dark text-white hover:bg-primary shadow-md focus-visible:ring-primary",
  outline: "border-2 border-primary text-primary hover:bg-accent-soft focus-visible:ring-primary bg-card",
  ghost: "text-primary hover:bg-accent-soft focus-visible:ring-primary bg-transparent",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger",
} as const;

const sizeClasses = {
  sm: "px-3.5 py-2 text-sm min-h-[44px]",
  md: "px-5 py-2.5 text-base min-h-[44px]",
  lg: "px-7 py-3.5 text-lg min-h-[48px]",
} as const;

export function linkButtonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 no-underline",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(linkButtonClassName({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

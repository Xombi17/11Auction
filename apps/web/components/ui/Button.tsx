"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "live" | "danger" | "warning" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand to-brand2 text-white hover:shadow-glow hover:opacity-90",
  secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
  live: "bg-live text-base font-black hover:shadow-glow-live hover:scale-[1.01] active:scale-[0.99]",
  danger: "bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30",
  warning: "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
  ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-12 px-6 text-sm rounded-xl",
  lg: "h-14 px-8 text-base rounded-xl",
  xl: "h-16 px-10 text-lg rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

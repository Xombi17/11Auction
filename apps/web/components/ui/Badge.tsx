"use client";

import React from "react";

type BadgeVariant = "default" | "live" | "sold" | "unsold" | "danger" | "warning" | "brand";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulse?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/5 border-white/10 text-white/70",
  live: "bg-live/10 border-live/30 text-live",
  sold: "bg-sold/10 border-sold/30 text-sold",
  unsold: "bg-unsold/10 border-unsold/30 text-unsold",
  danger: "bg-danger/10 border-danger/30 text-danger",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  brand: "bg-brand/10 border-brand/30 text-brand-light",
};

export function Badge({ children, variant = "default", className = "", pulse = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${variants[variant]} ${pulse ? "animate-pulse" : ""} ${className}`}
    >
      {variant === "live" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

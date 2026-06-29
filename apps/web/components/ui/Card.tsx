"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "raised";
}

export function Card({ children, className = "", variant = "glass" }: CardProps) {
  const base =
    variant === "raised"
      ? "bg-surface-raised border-white/[0.12]"
      : variant === "default"
        ? "bg-surface border-white/10"
        : "bg-white/[0.04] border-white/[0.08]";

  return (
    <div
      className={`${base} rounded-3xl p-6 sm:p-8 backdrop-blur-xl border shadow-xl transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-xl sm:text-2xl font-bold text-white tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-sm text-white/50 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

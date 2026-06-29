"use client";

import React from "react";

interface CountdownRingProps {
  secondsRemaining: number;
  totalSeconds: number;
  size?: number;
  stroke?: number;
  className?: string;
}

export function CountdownRing({
  secondsRemaining,
  totalSeconds,
  size = 120,
  stroke = 8,
  className = "",
}: CountdownRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  const isLow = secondsRemaining <= 5 && secondsRemaining > 0;
  const isEmpty = secondsRemaining === 0;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${secondsRemaining} seconds remaining`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-300 ${isEmpty ? "text-white/20" : isLow ? "text-danger" : "text-live"}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-3xl font-black tabular-nums font-mono ${isEmpty ? "text-white/30" : isLow ? "text-danger" : "text-white"}`}
        >
          {secondsRemaining}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Secs</span>
      </div>
    </div>
  );
}

"use client";

import React from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7l9.2 9.2M17 7v9.2H7.8" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StatCard({ title, value, subtitle, icon, trend, className = "" }: StatCardProps) {
  return (
    <div
      className={`animate-fade-in relative rounded-xl p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5 cursor-default ${className}`}
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: "var(--color-accent-muted)",
            color: "var(--color-accent-text)",
          }}
        >
          {icon}
        </span>

        {trend && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: trend.positive ? "var(--color-success-muted)" : "var(--color-danger-muted)",
              color: trend.positive ? "var(--color-success)" : "var(--color-danger)",
            }}
          >
            {trend.positive ? <TrendUpIcon /> : <TrendDownIcon />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </p>

      {/* Title */}
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {title}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="mt-0.5 text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

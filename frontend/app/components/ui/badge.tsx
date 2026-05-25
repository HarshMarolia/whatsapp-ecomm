import React from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Variant styles (CSS variable references)                           */
/* ------------------------------------------------------------------ */

const variantStyles: Record<
  NonNullable<BadgeProps["variant"]>,
  { background: string; color: string }
> = {
  success: {
    background: "var(--color-success-muted)",
    color: "var(--color-success)",
  },
  warning: {
    background: "var(--color-warning-muted)",
    color: "var(--color-warning)",
  },
  danger: {
    background: "var(--color-danger-muted)",
    color: "var(--color-danger)",
  },
  info: {
    background: "var(--color-info-muted)",
    color: "var(--color-info)",
  },
  default: {
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-secondary)",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${className}`}
      style={{
        background: styles.background,
        color: styles.color,
      }}
    >
      {children}
    </span>
  );
}

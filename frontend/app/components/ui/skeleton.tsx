import React from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

/* ------------------------------------------------------------------ */
/*  Variant defaults                                                   */
/* ------------------------------------------------------------------ */

const variantDefaults: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "h-4 w-full rounded-md",
  circular: "h-10 w-10 rounded-full",
  rectangular: "h-24 w-full rounded-xl",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer ${variantDefaults[variant]} ${className}`}
      role="status"
      aria-label="Loading…"
    />
  );
}

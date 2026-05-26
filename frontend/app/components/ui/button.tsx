"use client";

import React, { forwardRef, type ButtonHTMLAttributes } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Variant style maps                                                 */
/* ------------------------------------------------------------------ */

const variantBaseStyles: Record<
  NonNullable<ButtonProps["variant"]>,
  React.CSSProperties
> = {
  primary: {
    background: "var(--color-accent)",
    color: "var(--color-text-inverse)",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
  },
  danger: {
    background: "var(--color-danger)",
    color: "#ffffff",
    border: "1px solid transparent",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
};

const variantHoverStyles: Record<
  NonNullable<ButtonProps["variant"]>,
  React.CSSProperties
> = {
  primary: { background: "var(--color-accent-hover)" },
  secondary: { background: "var(--color-bg-hover)", borderColor: "var(--color-border-hover)" },
  danger: { background: "#dc2626" },
  ghost: { background: "var(--color-bg-hover)", color: "var(--color-text-primary)" },
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-base gap-2.5 rounded-xl",
};

/* ------------------------------------------------------------------ */
/*  Spinner                                                            */
/* ------------------------------------------------------------------ */

const Spinner = ({ size }: { size: string }) => {
  const px = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  return (
    <svg
      className="animate-spin"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      style,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref
  ) => {
    const baseStyle = variantBaseStyles[variant];
    const hoverStyle = variantHoverStyles[variant];
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          select-none cursor-pointer
          ${sizeClasses[size]}
          ${className}
        `}
        style={{
          ...baseStyle,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            Object.assign(e.currentTarget.style, hoverStyle);
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, baseStyle);
          if (style) Object.assign(e.currentTarget.style, style);
          onMouseLeave?.(e);
        }}
        {...rest}
      >
        {loading && <Spinner size={size} />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

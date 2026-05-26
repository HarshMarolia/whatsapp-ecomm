"use client";

import React, { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const baseInputClasses =
  "w-full rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all duration-200 placeholder:font-normal";

function getInputStyle(hasError: boolean): React.CSSProperties {
  return {
    background: "var(--color-bg-input)",
    color: "var(--color-text-primary)",
    border: `1px solid ${hasError ? "var(--color-danger)" : "var(--color-border)"}`,
  };
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "var(--color-danger)" : "var(--color-accent)";
  e.currentTarget.style.boxShadow = `0 0 0 3px ${hasError ? "var(--color-danger-muted)" : "var(--color-focus-ring)"}`;
}

function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, hasError: boolean) {
  e.currentTarget.style.borderColor = hasError ? "var(--color-danger)" : "var(--color-border)";
  e.currentTarget.style.boxShadow = "none";
}

/* ------------------------------------------------------------------ */
/*  Label + helpers                                                    */
/* ------------------------------------------------------------------ */

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block mb-1.5 text-sm font-medium"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </label>
  );
}

function HelperText({ error, helper }: { error?: string; helper?: string }) {
  if (!error && !helper) return null;
  return (
    <p
      className="mt-1.5 text-xs"
      style={{ color: error ? "var(--color-danger)" : "var(--color-text-tertiary)" }}
    >
      {error || helper}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Input                                                              */
/* ------------------------------------------------------------------ */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, wrapperClassName = "", className = "", id, ...rest }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const hasError = !!error;

    return (
      <div className={wrapperClassName}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputClasses} ${className}`}
          style={getInputStyle(hasError)}
          onFocus={(e) => handleFocus(e, hasError)}
          onBlur={(e) => handleBlur(e, hasError)}
          {...rest}
        />
        <HelperText error={error} helper={helper} />
      </div>
    );
  }
);
Input.displayName = "Input";

/* ------------------------------------------------------------------ */
/*  Textarea                                                           */
/* ------------------------------------------------------------------ */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, wrapperClassName = "", className = "", id, ...rest }, ref) => {
    const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const hasError = !!error;

    return (
      <div className={wrapperClassName}>
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${baseInputClasses} min-h-[100px] resize-y ${className}`}
          style={getInputStyle(hasError)}
          onFocus={(e) => handleFocus(e, hasError)}
          onBlur={(e) => handleBlur(e, hasError)}
          {...rest}
        />
        <HelperText error={error} helper={helper} />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ------------------------------------------------------------------ */
/*  Select                                                             */
/* ------------------------------------------------------------------ */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, options, placeholder, wrapperClassName = "", className = "", id, ...rest }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const hasError = !!error;

    return (
      <div className={wrapperClassName}>
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <select
          ref={ref}
          id={selectId}
          className={`${baseInputClasses} appearance-none cursor-pointer ${className}`}
          style={{
            ...getInputStyle(hasError),
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239a9aab' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
          }}
          onFocus={(e) => handleFocus(e, hasError)}
          onBlur={(e) => handleBlur(e, hasError)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <HelperText error={error} helper={helper} />
      </div>
    );
  }
);
Select.displayName = "Select";

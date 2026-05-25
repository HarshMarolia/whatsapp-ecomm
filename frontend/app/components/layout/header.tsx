"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Products",
  "/customers": "Customers",
  "/orders": "Orders",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Try prefix matching for nested routes
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (prefix !== "/" && pathname.startsWith(prefix)) return title;
  }
  return "Dashboard";
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const [isDark, setIsDark] = useState(true);

  /* Sync with <html> class on mount */
  useEffect(() => {
    const html = document.documentElement;
    const isLight = html.classList.contains("light");
    setIsDark(!isLight);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  /* Restore saved theme on mount */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      setIsDark(false);
    }
  }, []);

  return (
    <header
      id="dashboard-header"
      className="flex items-center justify-between px-4 sm:px-6 shrink-0 border-b"
      style={{
        height: "var(--header-height)",
        background: "var(--color-bg-secondary)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          id="header-mobile-menu"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-lg transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>

        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Avatar placeholder */}
        <button
          id="header-avatar"
          className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-shadow duration-150"
          style={{
            background: "var(--color-accent-muted)",
            color: "var(--color-accent-text)",
            border: "2px solid var(--color-border)",
          }}
          aria-label="User menu"
        >
          A
        </button>
      </div>
    </header>
  );
}

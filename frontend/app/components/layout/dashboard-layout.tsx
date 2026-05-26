"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "sidebar-collapsed";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Restore collapsed state from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsCollapsed(true);
    setMounted(true);
  }, []);

  const handleToggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const handleMobileToggle = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  /* Prevent flash of incorrect layout before hydration */
  if (!mounted) {
    return (
      <div className="flex h-screen" style={{ background: "var(--color-bg-primary)" }} />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-primary)" }}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main area: offset by sidebar width on desktop */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-[margin-left] duration-300 ease-in-out"
        style={{
          marginLeft: "var(--sidebar-offset, 0px)",
        }}
      >
        {/* Inject sidebar offset as CSS variable for responsive control */}
        <style>{`
          @media (min-width: 1024px) {
            :root { --sidebar-offset: ${isCollapsed ? 72 : 260}px; }
          }
          @media (max-width: 1023px) {
            :root { --sidebar-offset: 0px; }
          }
        `}</style>

        <Header onMobileMenuToggle={handleMobileToggle} />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{ background: "var(--color-bg-primary)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG – 20×20, strokeWidth 1.75)                      */
/* ------------------------------------------------------------------ */

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <GridIcon /> },
  { label: "Products", href: "/products", icon: <BoxIcon /> },
  { label: "Customers", href: "/customers", icon: <UsersIcon /> },
  { label: "Orders", href: "/orders", icon: <CartIcon /> },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  /* Close mobile menu on route change */
  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  /* ---- Shared sidebar content ---- */
  const sidebarContent = (mobile: boolean) => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        {/* Green dot indicator */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--color-accent-muted)" }}
        >
          <span
            className="block h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
          />
        </span>
        {(!isCollapsed || mobile) && (
          <span
            className="text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden"
            style={{ color: "var(--color-text-primary)" }}
          >
            WhatsApp Commerce
          </span>
        )}
        {/* Mobile close */}
        {mobile && (
          <button
            id="sidebar-mobile-close"
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-md transition-colors duration-150"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2" style={{ borderBottom: "1px solid var(--color-border-subtle)" }} />

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                color: active ? "var(--color-accent-text)" : "var(--color-text-secondary)",
                background: active ? "var(--color-sidebar-active)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--color-sidebar-hover)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }
              }}
            >
              {/* Active left border indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}

              <span className="shrink-0">{item.icon}</span>
              {(!isCollapsed || mobile) && (
                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="px-3 pb-4 mt-auto">
          <button
            id="sidebar-collapse-toggle"
            onClick={onToggle}
            className="flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200"
            style={{ color: "var(--color-text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-sidebar-hover)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={isCollapsed} />
            {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ---- Desktop sidebar ---- */}
      <aside
        id="sidebar-desktop"
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 transition-[width] duration-300 ease-in-out border-r"
        style={{
          width: isCollapsed ? 72 : 260,
          background: "var(--color-sidebar-bg)",
          borderColor: "var(--color-border)",
        }}
      >
        {sidebarContent(false)}
      </aside>

      {/* ---- Mobile backdrop ---- */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
          style={{ background: "var(--color-overlay)" }}
          onClick={onMobileClose}
        />
      )}

      {/* ---- Mobile drawer ---- */}
      <aside
        id="sidebar-mobile"
        className={`fixed top-0 left-0 h-screen w-[280px] z-50 flex flex-col lg:hidden transition-transform duration-300 ease-in-out border-r ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--color-sidebar-bg)",
          borderColor: "var(--color-border)",
        }}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
}

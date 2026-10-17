"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/security", label: "Security" },
  { href: "/account/activity", label: "Activity" },
  { href: "/account/billing", label: "Billing" },
] as const;

/** Horizontal account navigation with active states. */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-none flex items-center gap-1 overflow-x-auto"
      aria-label="Account sections"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

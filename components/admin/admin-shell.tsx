"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert02Icon,
  AlertDiamondIcon,
  AnalyticsUpIcon,
  CpuIcon,
  DashboardSquare01Icon,
  File02Icon,
  Message02Icon,
  PuzzleIcon,
  ScrollIcon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NetgoatLogo } from "@/components/brand/netgoat-logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADMIN_LINKS: Array<{
  href: string;
  label: string;
  icon: IconSvgElement;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: DashboardSquare01Icon, exact: true },
  { href: "/admin/users", label: "Users", icon: UserGroupIcon },
  { href: "/admin/content", label: "Content", icon: File02Icon },
  { href: "/admin/alerts", label: "Alerts", icon: Alert02Icon },
  { href: "/admin/incidents", label: "Incidents", icon: AlertDiamondIcon },
  { href: "/admin/analytics", label: "Analytics", icon: AnalyticsUpIcon },
  { href: "/admin/logs", label: "Logs", icon: ScrollIcon },
  { href: "/admin/feedback", label: "Feedback", icon: Message02Icon },
  { href: "/admin/plugins", label: "Plugins", icon: PuzzleIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings01Icon },
  { href: "/admin/system", label: "System", icon: CpuIcon },
];

/** Chrome for the admin console: brand, section nav and quick exits. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            aria-label="NetGoat admin home"
          >
            <NetgoatLogo className="size-6" />
            <span className="font-heading hidden text-sm font-semibold tracking-tight sm:inline">
              NetGoat
            </span>
          </Link>
          <Badge variant="outline" className="uppercase">
            Admin
          </Badge>

          <div className="ms-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <nav
          aria-label="Admin sections"
          className="scrollbar-none mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-px md:px-6"
        >
          {ADMIN_LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                <HugeiconsIcon icon={link.icon} className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

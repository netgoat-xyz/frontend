"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Analytics02Icon,
  HierarchyIcon,
  Home01Icon,
  Key01Icon,
  LockPasswordIcon,
  Route01Icon,
  ScrollIcon,
  ServerStack01Icon,
  Settings01Icon,
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type DomainNavProps = {
  teamSlug: string;
  domainName: string;
  basePath?: string;
  compact?: boolean;
  dnsEnabled?: boolean;
  /** Which section labels to render (defaults to every domain section). */
  sections?: string[];
};

/** Section navigation for a domain (or subdomain) workspace. */
export function DomainNav({
  teamSlug,
  domainName,
  basePath,
  compact = false,
  dnsEnabled = true,
  sections,
}: DomainNavProps) {
  const pathname = usePathname();
  const base = basePath ?? `/dashboard/${teamSlug}/${domainName}`;

  const links: Array<{ label: string; href: string; icon: IconSvgElement; exact?: boolean }> = [
    { label: "Overview", href: base, icon: Home01Icon, exact: true },
    { label: "DNS", href: `${base}/dns`, icon: ServerStack01Icon },
    { label: "Routes", href: `${base}/reverse-proxies`, icon: Route01Icon },
    { label: "SSL", href: `${base}/ssl`, icon: LockPasswordIcon },
    { label: "WAF", href: `${base}/waf`, icon: Shield02Icon },
    { label: "Subdomains", href: `${base}/subdomains`, icon: HierarchyIcon },
    { label: "Access", href: `${base}/access`, icon: Key01Icon },
    { label: "Analytics", href: `${base}/analytics`, icon: Analytics02Icon },
    { label: "Logs", href: `${base}/logs`, icon: ScrollIcon },
    { label: "Settings", href: `${base}/settings`, icon: Settings01Icon },
  ];

  const visible = sections
    ? links.filter((link) => sections.includes(link.label))
    : links;
  const available = dnsEnabled ? visible : visible.filter((link) => link.label !== "DNS");

  return (
    <nav
      aria-label="Domain sections"
      className="scrollbar-none -mb-px flex items-center gap-1 overflow-x-auto"
    >
      {available.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-accent-foreground border-border"
                : "text-muted-foreground hover:text-foreground",
              compact && "px-2 py-1 text-xs",
            )}
          >
            <HugeiconsIcon
              icon={link.icon}
              className={compact ? "size-3.5" : "size-4"}
            />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

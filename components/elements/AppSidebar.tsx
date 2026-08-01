"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Activity,
  Settings,
  Users,
  Globe,
  FileText,
  BarChart3,
  Lock,
  Shield,
  Zap,
  ExternalLink,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
};

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  const isAccount = segments[0] === "account";
  const isAdmin = segments[0] === "admin";
  const isTeamsDirectory = isDashboard && segments[1] === "teams";
  const topLevelSlugs = ["integrations", "teams", "activity", "settings", "overview"];

  if (!isDashboard && !isAccount && !isAdmin) return null;

  const teamName = isDashboard && !isTeamsDirectory ? segments[1] : null;
  const domainName =
    teamName &&
    segments[2] &&
    !topLevelSlugs.includes(segments[2].toLowerCase())
      ? segments[2]
      : null;

  const teamPath = teamName ? `/dashboard/${teamName}` : null;
  const projectPath = domainName ? `${teamPath}/${domainName}` : null;

  const navItems: SidebarItem[] = (() => {
    if (isAccount) {
      return [
        { title: "Overview", href: "/account", icon: LayoutDashboard },
        { title: "Activity", href: "/account/activity", icon: Activity },
        { title: "Settings", href: "/account/settings", icon: Settings },
      ];
    }
    if (isAdmin) {
      return [
        { title: "Overview", href: "/admin", icon: LayoutDashboard },
        { title: "Users", href: "/admin/users", icon: Users },
        { title: "Settings", href: "/admin/settings", icon: Settings },
        { title: "Logs", href: "/admin/logs", icon: Activity },
        { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { title: "Alerts", href: "/admin/alerts", icon: Activity },
        { title: "Incidents", href: "/admin/incidents", icon: Activity },
        { title: "Content", href: "/admin/content", icon: FileText },
        { title: "Plugins", href: "/admin/plugins", icon: Zap },
      ];
    }
    if (isTeamsDirectory) {
      return [
        { title: "Teams", href: "/dashboard/teams", icon: Users },
        { title: "Create Team", href: "/dashboard/teams/new", icon: Users },
      ];
    }
    if (projectPath) {
      return [
        { title: "Overview", href: projectPath, icon: LayoutDashboard },
        { title: "Subdomains", href: `${projectPath}/subdomains`, icon: Globe },
        { title: "DNS", href: `${projectPath}/dns`, icon: FileText },
        { title: "Reverse Proxies", href: `${projectPath}/reverse-proxies`, icon: Globe },
        { title: "SSL/TLS", href: `${projectPath}/ssl`, icon: Lock },
        { title: "WAF Rules", href: `${projectPath}/waf`, icon: Shield },
        { title: "Analytics", href: `${projectPath}/analytics`, icon: BarChart3 },
        { title: "Settings", href: `${projectPath}/settings`, icon: Settings },
      ];
    }
    return [
      { title: "Overview", href: teamPath || "/dashboard/@me", icon: LayoutDashboard },
      { title: "Integrations", href: `${teamPath || "/dashboard/@me"}/integrations`, icon: Zap },
      { title: "Teams", href: "/dashboard/teams", icon: Users },
      { title: "Settings", href: `${teamPath || "/dashboard/@me"}/settings`, icon: Settings },
    ];
  })();

  const isActive = (href: string) => {
    if ((teamPath && href === teamPath) || (projectPath && href === projectPath)) return pathname === href;
    if (isAccount) return href === "/account" ? pathname === href : pathname.startsWith(href);
    if (isAdmin) return href === "/admin" ? pathname === href : pathname.startsWith(href);
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      <div className="px-3 py-4 flex items-center justify-between border-b border-neutral-800/50">
        <Link
          href={teamPath || "/dashboard/teams"}
          className="flex items-center gap-2 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
        >
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            N
          </div>
          {!collapsed && <span className="truncate">NetGoat</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={14}
            className={cn("transition-transform duration-200", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-neutral-700 text-neutral-300">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-3 py-3 border-t border-neutral-800/50">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-all duration-150",
            collapsed && "justify-center"
          )}
        >
          <ExternalLink size={14} className="shrink-0" />
          {!collapsed && <span>Public Site</span>}
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 w-10 h-10 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center text-neutral-400 shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-neutral-800 transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-neutral-950 border-r border-neutral-800 h-full transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

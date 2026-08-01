"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Boxes,
  Code2,
  PackageCheck,
  ShieldCheck,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Overview", href: "/developers/overview", icon: LayoutDashboard },
  { title: "Catalog", href: "/developers/catalog", icon: Boxes },
  { title: "My Plugins", href: "/developers/plugins", icon: Code2 },
  { title: "Team Installs", href: "/developers/installations", icon: PackageCheck },
  { title: "Publisher", href: "/developers/publisher", icon: ShieldCheck },
  { title: "Docs", href: "/developers/docs", icon: BookOpen },
];

export default function DeveloperSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-neutral-950 border-r border-neutral-800 min-h-svh transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="px-3 py-4 flex items-center justify-between border-b border-neutral-800/50">
        <Link
          href="/developers"
          className="flex items-center gap-2 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
        >
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            D
          </div>
          {!collapsed && <span className="truncate">Developers</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-6 h-6 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft size={14} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/") || 
            (item.href === "/developers/overview" && pathname === "/developers");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-neutral-800/50">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-all duration-150",
            collapsed && "justify-center"
          )}
        >
          <LayoutDashboard size={14} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </div>
    </aside>
  );
}

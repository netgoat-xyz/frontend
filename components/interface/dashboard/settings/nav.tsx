"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "", label: "General" },
  { href: "/members", label: "Members" },
  { href: "/billing", label: "Billing" },
  { href: "/tokens", label: "Tokens" },
];

export default function SettingsNav({ teamName }: { teamName: string }) {
  const pathname = usePathname();
  const baseUrl = `/dashboard/${teamName}/settings`;

  return (
    <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-visible">
      {items.map((item) => {
        const url = `${baseUrl}${item.href}`;
        const isActive = pathname === url;
        
        return (
          <Link
            key={item.href}
            href={url}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
              isActive
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

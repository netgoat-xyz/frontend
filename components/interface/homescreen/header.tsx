"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { Dropdown, DropdownItem } from "@/components/elements/Dropdown";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const t = useTranslations("HomePage");

  const { data: session, isPending } = authClient.useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <header className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5">
      {/* --- Logo --- */}
      <Link href="/" className="flex items-center">
        <h1 className="text-xl tracking-normal text-white font-calsans">
          {t("netgoat")}
        </h1>
      </Link>

      {/* --- Navigation --- */}
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 backdrop-blur-md border border-white/6 px-1.5 py-1">
        <Link href="/" className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          {t("home")}
        </Link>
        <Link href={"/blog" as any} className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          {t("blogs")}
        </Link>
        <Link href="https://docs.netgoat.xyz" className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          {t("docs")}
        </Link>
        <Link href={"/status" as any} className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          Status
        </Link>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Link href="https://discord.gg/3aJ7MdJsZV" className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          {t("discord")}
        </Link>
        <Link href="https://github.com/netgoat-xyz/netgoat" className="text-white/70 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200">
          {t("source_code")}
        </Link>
      </nav>

      {/* --- Authentication Area --- */}
      <div className="relative min-w-25 flex justify-end">
        {isPending ? (
          <div className="h-8 w-24 bg-white/5 animate-pulse rounded-full" />
        ) : session ? (
          <div className="relative">
            {/* Profile trigger */}
            <button
              ref={triggerRef}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsMenuOpen((v) => !v);
              }}
              className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/8 backdrop-blur-md rounded-full transition-all duration-200 group cursor-pointer"
            >
              {/* Avatar */}
              <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={`https://tapback.co/api/avatar/${encodeURIComponent(session.user.name || "User")}`}
                    alt={session.user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <span className="text-xs text-white/80 font-light max-w-20 truncate hidden sm:inline">
                {session.user.name}
              </span>
              <ChevronDown className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors shrink-0" />
            </button>

            {/* Dropdown — uses custom animated dropdown component */}
        <Dropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          triggerRef={triggerRef || null}
        >
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
          </div>
          <div className="p-1">
            <DropdownItem label="Dashboard" href="/dashboard" />
            <DropdownItem label="Settings" href="/account/settings" />
            <div className="h-px bg-neutral-800 my-1" />
            <DropdownItem label="Sign out" href="/logout" />
          </div>
        </Dropdown>
          </div>
        ) : (
          <div
            id="gooey-btn"
            className="relative flex items-center group"
            style={{ filter: "url(#gooey-filter)" }}
          >
            <button
              onClick={() => router.push("/auth")}
              className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 cursor-pointer h-8 flex items-center z-10"
            >
              {t("login")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { Dropdown, DropdownItem } from "@/components/elements/Dropdown";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("HomePage");

  const { data: session, isPending } = authClient.useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { name: t("home"), href: "/" },
    { name: t("blogs"), href: "/blog" },
    { name: t("docs"), href: "/docs" },
    { name: t("status"), href: "/status" },
  ];

  const secondaryLinks = [
    { name: t("discord"), href: "https://discord.gg/3aJ7MdJsZV" },
    { name: t("source_code"), href: "https://github.com/netgoat-xyz/netgoat" },
  ];

  return (
    <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-5">
      {/* --- Logo --- */}
      <Link href="/" className="flex items-center group">
        <h1 className="text-xl tracking-normal text-white font-calsans transition-opacity group-hover:opacity-80">
          {t("netgoat")}
        </h1>
      </Link>

      {/* --- Navigation --- */}
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 backdrop-blur-md border border-white/6 px-1.5 py-1">
        <LayoutGroup id="header-nav">
          {navLinks.map((link) => {
            const isExternal = link.href.startsWith("http");
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href as any}
                target={isExternal ? "_blank" : undefined}
                className={cn(
                  "relative text-xs font-light px-4 py-1.5 rounded-full transition-colors duration-300 z-10",
                  isActive ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-white/10 rounded-full z-[-1] border border-white/5 shadow-sm"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  </>
                )}
                {link.name}
              </Link>
            );
          })}
        </LayoutGroup>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {secondaryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            className="text-white/50 hover:text-white text-xs font-light px-4 py-1.5 rounded-full hover:bg-white/5 transition-all duration-200"
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* --- Authentication Area --- */}
      <div className="relative flex items-center gap-2 justify-end min-w-0">
        <button
          onClick={() => setIsMobileNavOpen((v) => !v)}
          className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:text-white transition-colors"
        >
          {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <Dropdown isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)}>
          {[...navLinks, ...secondaryLinks].map((link) => (
            <DropdownItem
              key={link.href}
              label={link.name}
              href={link.href}
              onClick={() => setIsMobileNavOpen(false)}
            />
          ))}
        </Dropdown>

        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-8 w-24 bg-white/5 animate-pulse rounded-full"
            />
          ) : session ? (
            <motion.div
              key="user-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/8 backdrop-blur-md rounded-full transition-all group cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10">
                  <img
                    src={session.user.image || `https://tapback.co/api/avatar/${encodeURIComponent(session.user.name || "User")}`}
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs text-white/80 font-light max-w-20 truncate hidden sm:inline">
                  {session.user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-white/30 group-hover:text-white/50 transition-colors" />
              </button>

              <Dropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={triggerRef}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Account</p>
                  <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                </div>
                <div className="p-1">
                  <DropdownItem label="Dashboard" href="/dashboard" />
                  <DropdownItem label="Settings" href="/account/settings" />
                  <div className="h-px bg-white/5 my-1" />
                  <button 
                    onClick={() => authClient.signOut().then(() => router.refresh())}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </Dropdown>
            </motion.div>
          ) : (
            <motion.div
              key="auth-buttons"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => router.push("/auth")}
                className="md:hidden px-4 py-1.5 rounded-full bg-white text-black font-medium text-xs h-8"
              >
                {t("login")}
              </button>
              
              <div className="relative hidden md:flex items-center" style={{ filter: "url(#gooey-filter)" }}>
                <button
                  onClick={() => router.push("/auth")}
                  className="relative px-6 py-2 rounded-full hover:cursor-pointer hover:bg-neutral-400 bg-white text-black font-medium text-xs transition-all duration-300 z-10 h-8 flex items-center"
                >
                  {t("login")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
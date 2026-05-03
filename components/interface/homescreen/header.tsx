"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { authClient, useSession } from "@/lib/auth-client";
import { useAppSession } from "@/components/auth/AppSessionContext";
import { useState, useRef } from "react";
import { Dropdown, DropdownItem } from "@/components/elements/Dropdown";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("HomePage");

  const sessionFromContext = useAppSession();
  const { data: sessionFromClient, isPending: isClientSessionPending } =
    useSession();
  const user =
    sessionFromContext === undefined
      ? (sessionFromClient?.user ?? null)
      : (sessionFromContext?.user ?? null);
  const isResolvingSession =
    sessionFromContext === undefined && isClientSessionPending;

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
        <h1 className="text-xl tracking-normal text-foreground font-calsans transition-opacity group-hover:opacity-80">
          {t("netgoat")}
        </h1>
      </Link>

      {/* --- Navigation --- */}
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-card border border-border/60 shadow-sm px-1.5 py-1">
        <LayoutGroup id="header-nav">
          {navLinks.map((link) => {
            const isExternal = link.href.startsWith("http");
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href as any}
                target={isExternal ? "_blank" : undefined}
                className={cn(
                  "relative text-xs font-medium px-4 py-1.5 rounded-full transition-colors duration-300 z-10",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-foreground/10 rounded-full z-[-1] border border-border/60 shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  </>
                )}
                {link.name}
              </Link>
            );
          })}
        </LayoutGroup>

        <div className="w-px h-4 bg-border mx-1" />

        {secondaryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            className="text-muted-foreground hover:text-foreground text-xs font-medium px-4 py-1.5 rounded-full hover:bg-foreground/5 transition-all duration-200"
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* --- Authentication Area --- */}
      <div className="relative flex items-center gap-2 justify-end min-w-0">
        <button
          onClick={() => setIsMobileNavOpen((v) => !v)}
          className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-full border border-border/60 bg-foreground/5 text-foreground/80 hover:text-foreground transition-colors"
        >
          {isMobileNavOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>

        <Dropdown
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        >
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
          {user ? (
            <motion.div
              key="user-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 bg-foreground/5 hover:bg-foreground/10 border border-border/60 backdrop-blur-md rounded-full transition-all group cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 ring-1 ring-border/60">
                  <img
                    src={
                      user.image ||
                      `https://tapback.co/api/avatar/${encodeURIComponent(user.name || t("header.userFallback"))}`
                    }
                    alt={t("header.userAlt")}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xs text-foreground/80 font-medium max-w-20 truncate hidden sm:inline">
                  {user.name || t("header.userFallback")}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground/70 transition-colors" />
              </button>

              <Dropdown
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                triggerRef={triggerRef}
              >
                <div className="px-4 py-3 border-b border-border/60">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    {t("header.accountLabel")}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || t("header.userFallback")}
                  </p>
                </div>
                <div className="p-1">
                  <DropdownItem label={t("header.dashboard")} href="/dashboard" />
                  <DropdownItem label={t("header.settings")} href="/account/settings" />
                  <div className="h-px bg-border/60 my-1" />
                  <button
                    onClick={() =>
                      authClient.signOut().then(() => router.refresh())
                    }
                    className="cursor-pointer w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    {t("header.signOut")}
                  </button>
                </div>
              </Dropdown>
            </motion.div>
          ) : isResolvingSession ? (
            <div className="h-8 w-24" aria-hidden />
          ) : (
            <motion.div
              key="auth-buttons"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => router.push("/auth")}
                className="md:hidden px-4 py-1.5 rounded-full bg-foreground text-background font-medium text-xs h-8"
              >
                {t("login")}
              </button>

              <div
                className="relative hidden md:flex items-center"
                style={{ filter: "url(#gooey-filter)" }}
              >
                <button
                  onClick={() => router.push("/auth")}
                  className="relative px-6 py-2 rounded-full hover:cursor-pointer hover:bg-foreground/90 bg-foreground text-background font-medium text-xs transition-all duration-300 z-10 h-8 flex items-center"
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

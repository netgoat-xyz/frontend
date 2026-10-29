"use client";

import { Github01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import * as React from "react";

import { NetgoatLogo } from "@/components/brand/netgoat-logo";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/netgoat-xyz/netgoat";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#self-host", label: "Self-host" },
  { href: "#integrations", label: "Integrations" },
];

/**
 * Marketing header. Transparent over the top of the page and frosted once the
 * reader scrolls past the sentinel that `app/page.tsx` renders above it, so
 * the hero starts without a band across it.
 */
export function SiteHeader() {
  const [lifted, setLifted] = React.useState(false);

  React.useEffect(() => {
    const sentinel = document.querySelector("[data-marketing-top]");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => setLifted(!entries.some((entry) => entry.isIntersecting)),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-(--duration-fast) ease-(--ease-smooth-out)",
        lifted
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[75rem] items-center gap-1 px-5 md:px-6">
        <NetgoatLogo size="sm" className="mr-2 rounded-md" />

        <nav aria-label="Primary" className="hidden items-center md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}
          >
            <HugeiconsIcon icon={Github01Icon} />GitHub
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/auth/register" />}>
            Get started
          </Button>

          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <HugeiconsIcon icon={Menu01Icon} />
            </MenuTrigger>
            <MenuPopup align="end" className="min-w-44">
              {NAV_LINKS.map((link) => (
                <MenuLinkItem
                  key={link.href}
                  render={<a href={link.href} />}
                >
                  {link.label}
                </MenuLinkItem>
              ))}
              <MenuSeparator />
              <MenuLinkItem
                render={
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer" />
                }
              >
                GitHub
              </MenuLinkItem>
            </MenuPopup>
          </Menu>
        </div>
      </div>
    </header>
  );
}

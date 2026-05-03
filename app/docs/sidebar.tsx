"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useTranslations } from "next-intl";

export default function DocsSidebar() {
  const pathname = usePathname();
  const t = useTranslations("Docs.sidebar");
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    setActiveHash(window.location.hash);
    const handleHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.split('#')[1];
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
        setActiveHash(`#${hash}`);
      }
    }
  };

  const links = [
    {
      title: t("sections.gettingStarted"),
      items: [
        { label: t("items.introduction"), href: "/docs/intro" },
        { label: t("items.installation"), href: "/docs/installation" },
      ],
    },
    {
      title: t("sections.architectureComponents"),
      items: [
        {
          label: t("items.frontendAdmin"),
          href: "/docs/frontend",
          subItems: [
            {
              label: t("subItems.backendDatabaseLayer"),
              href: "/docs/frontend#backend-database-layer",
            },
            {
              label: t("subItems.exampleSync"),
              href: "/docs/frontend#example-configuration-sync",
            },
            {
              label: t("subItems.netgoatHeaders"),
              href: "/docs/frontend#netgoat-headers",
            },
          ],
        },
        { label: t("items.controlPlane"), href: "/docs/control-plane" },
        { label: t("items.edgeProxy"), href: "/docs/edge-proxy" },
        { label: t("items.dataStore"), href: "/docs/data-store" },
      ],
    },
    {
      title: t("sections.advanced"),
      items: [
        { label: t("items.databaseSchema"), href: "/docs/database" },
        {
          label: t("items.apiReference"),
          href: "/docs/api",
          subItems: [
            { label: t("subItems.apiDomains"), href: "/docs/api#1-domains" },
            {
              label: t("subItems.apiDnsRecords"),
              href: "/docs/api#2-dns-records",
            },
            {
              label: t("subItems.apiEdgeProxy"),
              href: "/docs/api#3-edge-proxy-configurations",
            },
          ],
        },
      ],
    },
    {
      title: t("sections.community"),
      items: [
        { label: t("items.translations"), href: "/docs/translations" },
      ],
    },
  ];

  return (
    <aside className="hidden sticky top-24 h-[calc(100vh-6rem)] w-full shrink-0 md:block overflow-y-auto pr-4 scrollbar-hide">
      <LayoutGroup>
        <nav className="flex flex-col gap-8 pb-10">
          {links.map((section) => (
            <div key={section.title}>
              <h4 className="px-3 mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                {section.title}
              </h4>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isParentActive = pathname === item.href;
                  const isAnyChildActive = item.subItems?.some(s => s.href.endsWith(activeHash) && activeHash !== "");
                  const active = isParentActive && !isAnyChildActive;

                  return (
                    <div key={item.href} className="flex flex-col gap-1">
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center filter backdrop-blur-sm rounded-xl px-3 py-2 text-sm transition-all duration-300 z-10",
                          active
                            ? "text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-pill"
                            className="absolute inset-0 rounded-xl bg-foreground/10 border border-border/60 shadow-sm z-[-1]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {item.label}
                      </Link>

                      <AnimatePresence>
                        {isParentActive && item.subItems && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-4 pl-2 border-l border-border/60"
                          >
                            <div className="flex flex-col gap-0.5 py-1">
                              {item.subItems.map((subItem) => {
                                const isSubActive = subItem.href.endsWith(activeHash) && activeHash !== "";
                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    onClick={(e) => handleSmoothScroll(e, subItem.href)}
                                    className={cn(
                                      "relative flex items-center rounded-lg px-3 py-2 text-xs transition-colors z-10",
                                      isSubActive
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground/80 hover:text-foreground"
                                    )}
                                  >
                                    {isSubActive && (
                                      <motion.span
                                        layoutId="sub-sidebar-pill"
                                        className="absolute inset-0 rounded-lg bg-foreground/5 z-[-1]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                      />
                                    )}
                                    {subItem.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </LayoutGroup>
    </aside>
  );
}
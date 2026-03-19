"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

export default function DocsSidebar() {
  const pathname = usePathname();
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
      title: "Getting Started",
      items: [
        { label: "Introduction", href: "/docs/intro" },
        { label: "Installation", href: "/docs/installation" },
      ],
    },
    {
      title: "Architecture Components",
      items: [
        { 
          label: "Frontend & Admin", 
          href: "/docs/frontend",
          subItems: [
            { label: "Backend Database Layer", href: "/docs/frontend#backend-database-layer" },
            { label: "Example Sync", href: "/docs/frontend#example-configuration-sync" },
            { label: "Netgoat Headers", href: "/docs/frontend#netgoat-headers" },
          ]
        },
        { label: "Control Plane", href: "/docs/control-plane" },
        { label: "Edge Proxy Engine", href: "/docs/edge-proxy" },
        { label: "Distributed Data Store", href: "/docs/data-store" },
      ],
    },
    {
      title: "Advanced",
      items: [
        { label: "Database Schema", href: "/docs/database" },
        { 
          label: "API Reference", 
          href: "/docs/api",
          subItems: [
            { label: "Domains", href: "/docs/api#1-domains" },
            { label: "DNS Records", href: "/docs/api#2-dns-records" },
            { label: "Edge Proxy Configurations", href: "/docs/api#3-edge-proxy-configurations" }
          ]
        },
      ],
    },
    {
      title: "Community & Contribution",
      items: [
        { label: "Translations", href: "/docs/translations" },
      ],
    },
  ];

return (
    <aside className="hidden sticky top-24 h-[calc(100vh-6rem)] w-full shrink-0 md:block overflow-y-auto pr-4 scrollbar-hide">
      <LayoutGroup>
        <nav className="flex flex-col gap-8 pb-10">
          {links.map((section) => (
            <div key={section.title}>
              <h4 className="px-3 mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
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
                          "relative flex items-center rounded-xl px-3 py-2 text-sm transition-all duration-300 z-10",
                          active ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-pill"
                            className="absolute inset-0 rounded-xl bg-white/10 border border-white/5 shadow-sm z-[-1]"
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
                            className="overflow-hidden ml-4 pl-2 border-l border-white/10"
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
                                      isSubActive ? "text-white font-medium" : "text-white/40 hover:text-white/70"
                                    )}
                                  >
                                    {isSubActive && (
                                      <motion.span
                                        layoutId="sub-sidebar-pill"
                                        className="absolute inset-0 rounded-lg bg-white/5 z-[-1]"
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
import Link from "next/link";

import { NetgoatLogo } from "@/components/brand/netgoat-logo";

const GITHUB_URL = "https://github.com/netgoat-xyz/netgoat";
const DISCORD_URL = "https://discord.gg/3aJ7MdJsZV";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#self-host", label: "Self-host" },
      { href: "#integrations", label: "Integrations" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth/register", label: "Create an account" },
      { href: "/auth/login", label: "Sign in" },
      { href: "/auth/forgot-password", label: "Reset a password" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: GITHUB_URL, label: "GitHub", external: true },
      { href: DISCORD_URL, label: "Discord", external: true },
      {
        href: `${GITHUB_URL}/blob/main/LICENSE`,
        label: "License (AGPL-3.0)",
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-b-0">
      <div className="mx-auto w-full max-w-[75rem] px-5 py-14 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <NetgoatLogo size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-[1.6] text-muted-foreground">
              A self-hosted edge panel: reverse proxy, DNS, TLS, WAF and
              analytics on hardware you control.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {column.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NetGoat · built in the open, alpha and
            proud of it
          </p>
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Your hardware · your data · your edge
          </p>
        </div>
      </div>
    </footer>
  );
}

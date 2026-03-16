"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("HomePage.footer");

  return (
    <footer className="relative z-20 py-16 px-4 sm:px-6">
      <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-12" />

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-light text-white/25">
            {t("rights")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href={"/status" as any}
              className="text-xs font-light text-white/25 hover:text-white/50 transition-colors"
            >
              Status
            </Link>
            <Link
              href="https://docs.netgoat.xyz"
              className="text-xs font-light text-white/25 hover:text-white/50 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com/netgoat-xyz/netgoat"
              className="text-xs font-light text-white/25 hover:text-white/50 transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://discord.gg/3aJ7MdJsZV"
              className="text-xs font-light text-white/25 hover:text-white/50 transition-colors"
            >
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

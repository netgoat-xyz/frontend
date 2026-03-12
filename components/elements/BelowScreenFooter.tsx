"use client";

import { GitCommit, Github, ArrowUpCircle, CheckCircle2, ChevronUp, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { Dropdown, DropdownItem } from "./Dropdown";

const languages: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  zh: "中文",
};

export default function BelowScreenFooter() {
  const locale = useLocale();
  const serverCommit = process.env.NEXT_PUBLIC_COMMIT_HASH || "dev";
  const [latestCommit, setLatestCommit] = useState<string | null>(null);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langTriggerRef = useRef<HTMLButtonElement>(null);

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  useEffect(() => {
    fetch(
      "https://api.github.com/repos/netgoat-xyz/frontend/commits/main",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.sha) {
          setLatestCommit(data.sha.substring(0, 7));
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const isOutdated =
    latestCommit && serverCommit !== "dev" && latestCommit !== serverCommit;

  return (
    <footer className="relative bottom-0 mt-auto w-full z-20 max-w-full py-10 px-4 sm:px-6 lg:px-8 mx-auto bg-neutral-900/85 filter backdrop-blur border-t border-neutral-800/95">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-10">
        <div className="col-span-full hidden lg:col-span-1 lg:block">
          <a
            className="flex-none font-semibold text-xl text-neutral-200 focus:outline-hidden focus:opacity-80"
            href="/"
            aria-label="Netgoat"
          >
            Netgoat
          </a>
          <p className="mt-3 text-xs sm:text-sm text-neutral-300/85">
            © {new Date().getFullYear()} The NetgoatOSS Foundation.
          </p>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
               <GitCommit className="size-3" />
               <span>{serverCommit.substring(0, 7)}</span>
               {isOutdated && (
                   <span className="flex items-center gap-1 text-amber-500" title="Update available">
                       <ArrowUpCircle className="size-3" />
                   </span>
               )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 uppercase">
            Product
          </h4>

          <div className="mt-3 grid space-y-3 text-sm">
            {/*<p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/pricing"
              >
                Pricing
              </a>
            </p>
            */
            }
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/changelog"
              >
                Changelog
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="https://docs.netgoat.xyz"
              >
                Docs
              </a>
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 uppercase">
            Company
          </h4>

          <div className="mt-3 grid space-y-3 text-sm">
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/about"
              >
                About us
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/blog"
              >
                Blog
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/contributing"
              >
                Contributing
              </a>{" "}
              <span className="inline text-blue-500">
                — We're Searching!
              </span>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/newsroom"
              >
                Newsroom
              </a>
            </p>
          </div>
        </div>
        {/* End Col */}

        <div>
          <h4 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 uppercase">
            Resources
          </h4>

          <div className="mt-3 grid space-y-3 text-sm">
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="https://forum.netgoat.xyz"
              >
                Community
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="https://forum.netgoat.xyz"
              >
                Help & Support
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="/whats-new"
              >
                What's New
              </a>
            </p>
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="https://status.netgoat.xyz"
              >
                Status
              </a>
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-800 dark:text-neutral-200 uppercase">
            Developers
          </h4>

          <div className="mt-3 grid space-y-3 text-sm">
            <p>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="https://github.com/netgoat-xyz/frontend"
              >
                GitHub - Frontend
              </a>
            </p>
            <p>
                <a
                    className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                    href="https://github.com/netgoat-xyz/netgoat"
                >
                    GitHub - Backend
                </a>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-gray-200 dark:border-neutral-700">
        <div className="sm:flex sm:justify-between sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative inline-flex">
              <button
                ref={langTriggerRef}
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="inline-flex items-center gap-x-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors py-2"
              >
                <Globe className="size-4" />
                <span>{languages[locale] || "Select Language"}</span>
                <ChevronUp
                  className={`size-4 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                />
              </button>

              <Dropdown
                isOpen={isLangOpen}
                onClose={() => setIsLangOpen(false)}
                triggerRef={langTriggerRef}
                className="bottom-full! top-auto! mt-0! mb-2! left-0! right-auto! min-w-45"
              >
                <div className="p-1">
                  {Object.entries(languages).map(([key, label]) => (
                    <DropdownItem
                      key={key}
                      label={label}
                      onClick={() => handleLanguageChange(key)}
                      variant={locale === key ? "primary" : "primary"} // Could add 'active' style if supported, else just default
                      rightSlot={
                        locale === key && <CheckCircle2 className="size-4 text-emerald-500" />
                      }
                    />
                  ))}
                </div>
              </Dropdown>
            </div>
            <div className="space-x-4 text-sm">
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                Terms
              </a>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                Privacy
              </a>
              <a
                className="inline-flex gap-x-2 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                Status
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="mt-3 sm:hidden">
              <a
                className="flex-none font-semibold text-xl text-gray-800 dark:text-neutral-200 focus:outline-hidden focus:opacity-80"
                href="#"
                aria-label="Brand"
              >
                Brand
              </a>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-neutral-300">
                © 2026 Preline Labs.
              </p>
            </div>

            <div className="space-x-4">
              <a
                className="inline-block text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                <svg
                  className="shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                </svg>
              </a>
              <a
                className="inline-block text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                <svg
                  className="shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
              <a
                className="inline-block text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 focus:outline-hidden focus:text-gray-800 dark:focus:text-neutral-200"
                href="#"
              >
                <svg
                  className="shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M3.362 10.11c0 .926-.756 1.681-1.681 1.681S0 11.036 0 10.111C0 9.186.756 8.43 1.68 8.43h1.682v1.68zm.846 0c0-.924.756-1.68 1.681-1.68s1.681.756 1.681 1.68v4.21c0 .924-.756 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68v-4.21zM5.89 3.362c-.926 0-1.682-.756-1.682-1.681S4.964 0 5.89 0s1.68.756 1.68 1.68v1.682H5.89zm0 .846c.924 0 1.68.756 1.68 1.681S6.814 7.57 5.89 7.57H1.68C.757 7.57 0 6.814 0 5.89c0-.926.756-1.682 1.68-1.682h4.21zm6.749 1.682c0-.926.755-1.682 1.68-1.682.925 0 1.681.756 1.681 1.681s-.756 1.681-1.68 1.681h-1.681V5.89zm-.848 0c0 .924-.755 1.68-1.68 1.68A1.685 1.685 0 0 1 8.43 5.89V1.68C8.43.757 9.186 0 10.11 0c.926 0 1.681.756 1.681 1.68v4.21zm-1.681 6.748c.926 0 1.682.756 1.682 1.681S11.036 16 10.11 16s-1.681-.756-1.681-1.68v-1.682h1.68zm0-.847c-.924 0-1.68-.755-1.68-1.68 0-.925.756-1.681 1.68-1.681h4.21c.924 0 1.68.756 1.68 1.68 0 .926-.756 1.681-1.68 1.681h-4.21z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

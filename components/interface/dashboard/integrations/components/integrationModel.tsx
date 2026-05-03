"use client";

import { motion, AnimatePresence } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: "installed" | "disabled";
  details?: string;
}

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
}

export default function IntegrationModal({
  isOpen,
  onClose,
  integration,
}: IntegrationModalProps) {
  const t = useTranslations("DashboardPages.integrations.shared");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock scroll
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = isOpen ? "hidden" : "";
      document.body.style.overflow = isOpen ? "hidden" : "";
    }

    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  if (!mounted || !integration) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
          
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-[min(100%-2rem,32rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label={t("actions.close")}
              className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors p-1"
            >
              <XMarkIcon className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
              {integration.logo ? (
                <Image
                  src={integration.logo}
                  alt={integration.name}
                  width={48}
                  height={48}
                  className="object-cover w-12 h-12 rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                  <div className="text-xl font-bold text-neutral-400">
                    {integration.name[0]}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-neutral-100 leading-tight">
                  {integration.name}
                </h3>
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
                  {integration.category}
                </span>
              </div>
            </div>

            {/* Body */}
            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              {integration.details || integration.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-neutral-300 border border-neutral-800 hover:bg-neutral-800 transition-colors"
              >
                {t("actions.cancel")}
              </button>

              <button
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                  integration.status === "installed"
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {integration.status === "installed"
                  ? t("actions.uninstall")
                  : t("actions.install")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
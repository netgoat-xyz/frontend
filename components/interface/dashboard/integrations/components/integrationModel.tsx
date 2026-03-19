"use client";

import { motion, AnimatePresence } from "motion/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
  status?: string;
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
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!integration) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors p-1"
            >
              <XMarkIcon className="size-5" />
            </button>

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

            <p className="text-neutral-400 text-sm leading-relaxed mb-8">
              {integration.details || integration.description}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-neutral-300 border border-neutral-800 hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>

              <button
                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                  integration.status === "installed"
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {integration.status === "installed" ? "Uninstall" : "Install"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

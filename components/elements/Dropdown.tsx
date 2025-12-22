"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { ReactNode, useRef, useEffect } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Dropdown({ isOpen, onClose, children, className = "" }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(4px)" }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`absolute right-0 mt-2 z-100 min-w-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DropdownItemVariant = "primary" | "disabled" | "destructive"

export function DropdownItem({
  label,
  href,
  icon,
  description,
  rightSlot,
  variant = "primary",
  className = "",
  onClick,
}: {
  label: string
  href?: string
  icon?: React.ReactNode
  description?: string
  rightSlot?: React.ReactNode
  variant?: DropdownItemVariant
  className?: string
  onClick?: () => void
}) {
  const base =
    "flex w-full items-start gap-3 px-3 py-2 rounded-[11px] text-sm transition-colors"

  const variants: Record<DropdownItemVariant, string> = {
    primary: "text-neutral-300 hover:bg-neutral-800",
    destructive: "text-red-400 hover:bg-red-500/10",
    disabled: "text-neutral-500 opacity-50 pointer-events-none",
  }

  const content = (
    <>
      {icon && <span className="mt-0.5">{icon}</span>}
      <span className="flex flex-col">
        <span className="leading-tight">{label}</span>
        {description && (
          <span className="text-xs text-neutral-500">{description}</span>
        )}
      </span>
      {rightSlot && <span className="ml-auto">{rightSlot}</span>}
    </>
  )

  const classes = `${base} ${variants[variant]} ${className}`

  if (href && variant !== "disabled") {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}

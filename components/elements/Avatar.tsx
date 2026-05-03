"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Dropdown, DropdownItem } from "./Dropdown";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface AvatarProps {
  src?: string;
  username?: string;
  showDropdown?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({
  src,
  username = "User",
  showDropdown = false,
  className = "",
  size = "sm",
}: AvatarProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const sizeConfig = {
    sm: { classes: "w-8 h-8", px: 32 },
    md: { classes: "w-10 h-10", px: 40 },
    lg: { classes: "w-12 h-12", px: 48 },
  };

  const { classes: sizeClasses, px: sizePx } = sizeConfig[size];

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (showDropdown) setIsOpen((v) => !v);
        }}
        aria-haspopup={showDropdown ? "menu" : undefined}
        aria-expanded={showDropdown ? isOpen : undefined}
        className={`
          ${sizeClasses}
          flex items-center justify-center rounded-full overflow-hidden bg-neutral-800 
          border border-neutral-700/50 shadow-sm transition-all duration-200 ease-out 
          hover:border-neutral-400 hover:shadow-md hover:ring-4 hover:ring-neutral-700/20
          active:scale-95 focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900
        `}
      >
        <Image
          src={
            src ||
            `https://tapback.co/api/avatar/${encodeURIComponent(username)}`
          }
          alt={username}
          width={sizePx}
          height={sizePx}
          className="object-cover w-full h-full"
        />
      </button>

      {showDropdown && (
        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef}
        >
          <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
            <p className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase">
              Signed in as
            </p>
            <p className="text-sm font-semibold text-white truncate mt-0.5">
              {username}
            </p>
          </div>

          <div className="p-1.5">
            <DropdownItem label="Dashboard" href="/dashboard" />
            <DropdownItem label="Settings" href="/account/settings" />
            <div className="h-px bg-neutral-800 my-1.5 mx-1" />
            <button
              onClick={() => authClient.signOut().then(() => router.refresh())}
              className="cursor-pointer w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </Dropdown>
      )}
    </div>
  );
}

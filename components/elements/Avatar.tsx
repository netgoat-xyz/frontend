"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Dropdown, DropdownItem } from "./Dropdown";

export default function Avatar({ src, username = "User", showDropdown = false, className = "" }: { src?: string; username?: string; showDropdown?: boolean; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (showDropdown) setIsOpen(v => !v);
        }}
        className="flex items-center justify-center overflow-hidden rounded-full border border-neutral-700 hover:border-neutral-500 transition-all active:scale-95 focus:outline-none"
        style={{ width: 32, height: 32 }}
      >
        {src ? (
          <Image src={src} alt={username} width={32} height={32} />
        ) : (
          <Image
            src={`https://tapback.co/api/avatar/${encodeURIComponent(username)}`}
            alt={username}
            width={32}
            height={32}
          />
        )}
      </button>

      {showDropdown && (
        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef || null}
        >
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{username}</p>
          </div>
          <div className="p-1">
            <DropdownItem label="Dashboard" href="/dashboard" />
            <DropdownItem label="Settings" href="/account/settings" />
            <div className="h-px bg-neutral-800 my-1" />
            <DropdownItem label="Sign out" href="/logout" />
          </div>
        </Dropdown>
      )}
    </div>
  );
}

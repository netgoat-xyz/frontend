"use client";

import { useState } from "react";
import Image from "next/image";
import Dropdown from "./Dropdown";

interface AvatarProps {
  src?: string;
  username?: string;
  showDropdown?: boolean;
  className?: string;
}

export default function Avatar({ src, username = "User", showDropdown = false, className = "" }: AvatarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={(e) => {
          // stopPropagation prevents the Dropdown's "click outside" 
          // listener from firing at the same time as this toggle
          e.stopPropagation();
          if (showDropdown) setIsOpen((prev) => !prev);
        }}
        className="flex items-center justify-center overflow-hidden rounded-full border border-neutral-700 hover:border-neutral-500 transition-all active:scale-95 focus:outline-none"
        style={{ width: 32, height: 32 }}
      >
        {src ? (
          <Image src={src} alt={username} width={32} height={32} className="object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
             <Image 
                src={`https://tapback.co/api/avatar/${username}`} 
                alt={username} 
                width={32} 
                height={32} 
                className="object-cover" 
              />
          </div>
        )}
      </button>

      {showDropdown && (
        <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{username}</p>
          </div>
          <div className="p-1">
            <DropdownItem label="Dashboard" href="/dashboard" />
            <DropdownItem label="Settings" href="/dashboard/settings" />
            <div className="h-px bg-neutral-800 my-1" />
            <DropdownItem label="Sign out" href="/logout" color="text-red-400" />
          </div>
        </Dropdown>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  href,
  color = "text-neutral-300",
}: {
  label: string;
  href: string;
  color?: string;
}) {
  return (
    <a
      href={href}
      className={`block px-3 py-2 text-sm rounded-md hover:bg-neutral-800 transition-colors ${color}`}
    >
      {label}
    </a>
  );
}

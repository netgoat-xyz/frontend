"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import SlashSeparator from "./Seperator";

export default function NavigationTop() {
  const pathname = usePathname() || "";
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // 1. Parse Segments: /dashboard/[teamName]/[domainName]
  const segments = pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  
  // Team name is always the segment after "dashboard"
  const teamName = isDashboard ? segments[1] : null;

  // Known top-level slugs that are NOT domain names
  const topLevelSlugs = ["integrations", "teams", "activity", "settings", "overview"];
  
  // Domain name is the segment after team name, IF it's not a reserved tab name
  const thirdSegment = segments[2] ?? null;
  const domainName = (teamName && thirdSegment && !topLevelSlugs.includes(thirdSegment.toLowerCase())) 
    ? thirdSegment 
    : null;

  // 2. Define Base Paths for Links
  // Base for Team: /dashboard/my-team
  // Base for Project: /dashboard/my-team/my-project
  const teamPath = `/dashboard/${teamName}`;
  const projectPath = domainName ? `${teamPath}/${domainName}` : null;

  const tabs = projectPath
    ? [
        { title: "Overview", href: `${projectPath}` },
        { title: "Analytics", href: `${projectPath}/analytics` },
        { title: "Pages", href: `${projectPath}/pages` },
        { title: "Settings", href: `${projectPath}/settings` },
      ]
    : [
        { title: "Overview", href: teamPath },
        { title: "Integrations", href: `${teamPath}/integrations` },
        { title: "Teams", href: `${teamPath}/teams` },
        { title: "Activity", href: `${teamPath}/activity` },
        { title: "Settings", href: `${teamPath}/settings` },
      ];

  // 3. Active Tab Logic
  const activeTab = tabs.reduce((prev, curr) => {
    return pathname.startsWith(curr.href) && curr.href.length > prev.href.length ? curr : prev;
  }, tabs[0]);
  
  const activeTitle = activeTab?.title || "Overview";

  return (
    <div className="flex flex-col bg-neutral-950 text-white">
      <nav className="sticky top-0 z-50 w-full flex-none flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-neutral-900 border-b border-neutral-800 w-full h-16 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Netgoat Logo">
              <Image src="/branding/logo.png" alt="Logo" width={28} height={28} className="rounded-full border border-neutral-700" />
            </Link>
            
            <SlashSeparator />

            <div className="flex items-center gap-2">
              {/* Team Selector / Breadcrumb */}
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-5 h-5 bg-blue-600 rounded text-[10px] flex items-center justify-center font-bold">
                  {teamName ? teamName[0].toUpperCase() : "P"}
                </div>
                <span className="text-sm font-medium">
                   {teamName ? decodeURIComponent(teamName) : "Personal Account"}
                </span>
                <SelectorIcon />
              </div>

              {domainName && (
                <>
                  <SlashSeparator />
                  <span className="text-sm font-medium">{decodeURIComponent(domainName)}</span>
                </>
              )}
              
              <SlashSeparator />
              <span className="text-sm font-medium text-neutral-400">{activeTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search, Feedback, Bell, Avatar */}
            <div className="hidden md:flex items-center bg-neutral-800/50 border border-neutral-800 rounded-full px-3 py-1.5 w-64 text-neutral-400">
              <SearchIcon />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm ml-2 w-full" />
            </div>

            <motion.button
              layoutId="FeedbackButtonID"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-xs font-medium bg-neutral-100 text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-300 transition-colors"
            >
              Feedback
            </motion.button>

            <Avatar username="Ducky" showDropdown={true} className="ml-1" />
          </div>
        </div>

        {/* Animated Tabs Row */}
        <div className="bg-neutral-900 border-b border-neutral-800 w-full px-4 md:px-6 overflow-x-auto no-scrollbar">
          <div className="h-12 flex items-center gap-6 text-sm text-neutral-400 relative">
            {tabs.map((tab) => {
              // Precise matching for the base tab vs sub-routes
              const isActive = tab.href === teamPath || tab.href === projectPath
                ? pathname === tab.href
                : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.title}
                  href={tab.href}
                  className={`relative h-full flex items-center px-1 transition-colors ${
                    isActive ? "text-white" : "hover:text-neutral-200"
                  }`}
                >
                  {tab.title}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      <Modal 
        layoutId="FeedbackModalID" 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
        title="Submit Feedback"
      >
        <div className="p-4 text-neutral-400 text-sm italic">Feedback form goes here...</div>
      </Modal>
    </div>
  );
}

// The Up/Down selector arrows
function SelectorIcon() {
  return (
    <svg
      height="16"
      width="16"
      viewBox="0 0 16 16"
      className="text-neutral-500"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.7071 2.39644C8.31658 2.00592 7.68341 2.00592 7.29289 2.39644L4.46966 5.21966L3.93933 5.74999L4.99999 6.81065L5.53032 6.28032L7.99999 3.81065L10.4697 6.28032L11 6.81065L12.0607 5.74999L11.5303 5.21966L8.7071 2.39644ZM5.53032 9.71966L4.99999 9.18933L3.93933 10.25L4.46966 10.7803L7.29289 13.6035C7.68341 13.9941 8.31658 13.9941 8.7071 13.6035L11.5303 10.7803L12.0607 10.25L11 9.18933L10.4697 9.71966L7.99999 12.1893L5.53032 9.71966Z"
      ></path>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.9925 0C4.95079 0 2.485 2.46579 2.485 5.5075V8.22669C2.485 8.77318 2.21321 9.28388 1.75992 9.58912L1.33108 9.8779L1 10.1009V10.5V11.25V12H1.75H14.25H15V11.25V10.5V10.0986L14.666 9.87596L14.2306 9.58565C13.7741 9.28137 13.5 8.76913 13.5 8.22059V5.5075C13.5 2.46579 11.0342 0 7.9925 0ZM3.985 5.5075C3.985 3.29422 5.77922 1.5 7.9925 1.5C10.2058 1.5 12 3.29422 12 5.5075V8.22059C12 9.09029 12.36 9.91233 12.9801 10.5H3.01224C3.62799 9.91235 3.985 9.09303 3.985 8.22669V5.5075ZM10.7486 13.5H9.16778L9.16337 13.5133C9.09591 13.716 8.94546 13.9098 8.72067 14.0501C8.52343 14.1732 8.27577 14.25 8.00002 14.25C7.72426 14.25 7.47661 14.1732 7.27936 14.0501C7.05458 13.9098 6.90412 13.716 6.83666 13.5133L6.83225 13.5H5.25143L5.41335 13.9867C5.60126 14.5516 5.99263 15.0152 6.48523 15.3226C6.92164 15.5949 7.44461 15.75 8.00002 15.75C8.55542 15.75 9.07839 15.5949 9.5148 15.3226C10.0074 15.0152 10.3988 14.5516 10.5867 13.9867L10.7486 13.5Z"
      ></path>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0Z"
      ></path>
    </svg>
  );
}

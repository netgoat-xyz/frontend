"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import SlashSeparator from "./Seperator";
import {
  Activity,
  BarChart3,
  Globe,
  Home,
  LayoutDashboard,
  Lock,
  Puzzle,
  Settings,
  Shield,
  Users,
  Zap,
  FileText,
  Layers,
  Network,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useLastTeamName from "@/hooks/lastTeam";
import NavSelectDrapdown from "./NavSelectDrapdown";
import { getTeam } from "@/actions/teams";
import { useSession } from "@/lib/auth-client";

export default function NavigationTop() {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = useSession();

  const pathname = usePathname() || "";
  const teamNameConfusion = useLastTeamName();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  const isAccount = segments[0] === "account";
  const isAdmin = segments[0] === "admin";

  const isGlobalTeamsPath = isDashboard && segments[1] === "teams";

  const teamName = isGlobalTeamsPath ? segments[2] : segments[1];

  // Fetch team data when teamName changes
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamName || isAccount || isAdmin || isGlobalTeamsPath) {
        setTeamData(null);
        return;
      }

      try {
        setLoadingTeam(true);
        const team = await getTeam(teamName);
        setTeamData(team);
      } catch (error) {
        // Silently fail - team name will fallback to URL slug
        setTeamData(null);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamData();
  }, [teamName, isAccount, isAdmin, isGlobalTeamsPath]);

  const topLevelSlugs = [
    "integrations",
    "teams",
    "activity",
    "settings",
    "overview",
  ];

  const domainName =
    !isGlobalTeamsPath &&
    teamName &&
    segments[2] &&
    !topLevelSlugs.includes(segments[2].toLowerCase())
      ? segments[2]
      : null;

  const teamPath = isGlobalTeamsPath
    ? `/dashboard/teams/${teamName}`
    : `/dashboard/${teamName}`;

  const projectPath = domainName
    ? `/dashboard/${teamName}/${domainName}`
    : null;

  let tabs = useMemo(() => {
  if (isAccount) {
    return [
      { title: "Overview", href: "/account", icon: Home },
      { title: "Activity", href: "/account/activity", icon: Activity },
      { title: "Settings", href: "/account/settings", icon: Settings },
    ];
  } else if (isAdmin) {
    return [
      { title: "Overview", href: "/admin", icon: LayoutDashboard },
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Settings", href: "/admin/settings", icon: Settings },
      { title: "Logs", href: "/admin/logs", icon: Activity },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { title: "Dashboard Alerts", href: "/admin/alerts", icon: Activity },
      { title: "Status Incidents", href: "/admin/incidents", icon: Activity },
      { title: "Content", href: "/admin/content", icon: FileText },
    ];
  } else if (projectPath) {
    return [
      { title: "Overview", href: projectPath, icon: LayoutDashboard },
      { title: "Subdomains", href: `${projectPath}/subdomains`, icon: LayoutDashboard },
      { title: "DNS", href: `${projectPath}/dns`, icon: Globe },
      { title: "Reverse-Proxies", href: `${projectPath}/reverse-proxies`, icon: Globe },
      { title: "SSL Certificates", href: `${projectPath}/ssl`, icon: Lock },
      { title: "WAF Rules", href: `${projectPath}/waf`, icon: Shield },
      { title: "Analytics", href: `${projectPath}/analytics`, icon: BarChart3 },
      { title: "Settings", href: `${projectPath}/settings`, icon: Settings },
    ];
  } else {
    return [
      {
        title: "Overview",
        href: `/dashboard/${teamNameConfusion}`,
        icon: LayoutDashboard,
      },
      {
        title: "Integrations",
        href: `/dashboard/${teamNameConfusion}/integrations`,
        icon: Puzzle,
      },
      { title: "Teams", href: "/dashboard/teams", icon: Users },
      {
        title: "Settings",
        href: `/dashboard/${teamNameConfusion}/settings`,
        icon: Settings,
      },
    ];
  }
  }, [isAccount, isAdmin, projectPath, teamNameConfusion]);

  const activeTab = useMemo(() =>
    tabs.find((tab) => {
      if (isAccount || isAdmin) {
        return tab.href === (isAccount ? "/account" : "/admin")
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
      }
      if (tab.href === teamPath || tab.href === projectPath) {
        return pathname === tab.href;
      }
      return pathname.startsWith(tab.href);
    }) || tabs[0]
  , [tabs, pathname, isAccount, isAdmin, teamPath, projectPath]);

  const activeTitle = activeTab?.title || "Overview";

  return (
    <div className="flex flex-col bg-neutral-950 text-white">
      <nav className="sticky top-0 z-50 w-full flex-none flex flex-col">
        <div className="bg-neutral-900 border-b border-neutral-800 w-full h-16 px-4 md:px-6 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/dashboard" aria-label="Home">
              <Image
                src="/branding/netgoat_no_text.png"
                alt="Logo"
                width={28}
                height={28}
                className="rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors"
              />
            </Link>

            <SlashSeparator />

            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              {isAccount && (
                <>
                  My Account
                  <NavSelectDrapdown />
                </>
              )}

              {isAdmin && (
                <>
                  <span className="text-sm font-medium truncate">Administration</span>
                  <NavSelectDrapdown />
                </>
              )}

              {!isAccount && !isAdmin && isGlobalTeamsPath && (
                <>
                  <Link
                    className="text-sm font-medium text-neutral-400 hover:text-neutral-300 transition-all"
                    href={`/dashboard/teams`}
                  >
                    Teams
                  </Link>
                  {teamName && <SlashSeparator />}
                </>
              )}

              {!isAccount && !isAdmin && teamName && (
                <div className="flex items-center gap-2">
                  {loadingTeam ? (
                    <>
                      <Skeleton className="w-4 h-4 rounded-sm" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-[10px] font-bold">
                        {teamData?.name?.[0]?.toUpperCase() || teamName[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate max-w-32 sm:max-w-48">
                        {teamData?.name || decodeURIComponent(teamName)}
                      </span>
                    </>
                  )}
                  <NavSelectDrapdown />
                </div>
              )}

              {!isAccount && !isAdmin && domainName && (
                <>
                  <SlashSeparator />
                  <span className="text-sm font-medium truncate max-w-28 sm:max-w-44">
                    {decodeURIComponent(domainName)}
                  </span>
                </>
              )}

              {!isAccount && !isAdmin && teamName && <SlashSeparator />}
              {!isAccount && !isAdmin && activeTitle !== "Teams" && (
                <span className="hidden sm:inline text-sm font-medium text-neutral-400 truncate">
                  {activeTitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="cursor-pointer hidden md:flex items-center bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 w-64 text-neutral-400 focus-within:border-neutral-500 transition-colors">
              <SearchIcon />
              <input
                type="text"
                placeholder="Find..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder:text-neutral-600"
              />
            </div>

            <motion.button
              layoutId="FeedbackButtonID"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="cursor-pointer hidden sm:block text-xs font-medium bg-neutral-100 text-neutral-900 px-3 py-1.5 rounded-md hover:bg-neutral-300 transition-colors"
            >
              Feedback
            </motion.button>

            <Avatar
              src={
                session?.user?.image ||
                `https://tapback.co/api/avatar/${encodeURIComponent(session?.user?.name || "User")}`
              }
              username={session?.user?.name || ""}
              showDropdown={true}
              className="ml-1"
            />
          </div>
        </div>

        <div className="bg-neutral-900 border-b border-neutral-800 w-full px-4 md:px-6 overflow-x-auto no-scrollbar">
          <div className="h-12 flex items-center gap-6 text-sm text-neutral-400 relative">
            {tabs.map((tab) => {
              const isActive = isAccount
                ? tab.href === "/account"
                  ? pathname === tab.href
                  : pathname.startsWith(tab.href)
                : tab.href === teamPath || tab.href === projectPath
                  ? pathname === tab.href
                  : pathname.startsWith(tab.href);

              const Icon = tab.icon;

              return (
                <Link
                  key={tab.title}
                  href={tab.href as any}
                  className={`relative h-full flex items-center px-1 transition-colors duration-200 ${
                    isActive ? "text-white" : "hover:text-neutral-200"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 mr-2" />}
                  {tab.title}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Submit Feedback"
      >
        <div className="p-4 text-neutral-400 text-sm">
          Feedback form content here...
        </div>
      </Modal>
    </div>
  );
}

// Icons
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

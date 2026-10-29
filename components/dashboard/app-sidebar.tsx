"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon,
  DashboardSquare01Icon,
  Globe02Icon,
  PuzzleIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NetgoatLogo } from "@/components/brand/netgoat-logo";
import {
  TeamSwitcher,
  type TeamOption,
} from "@/components/dashboard/team-switcher";
import { UserMenu, type ShellUser } from "@/components/dashboard/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  user: ShellUser;
  teams: TeamOption[];
  team: TeamOption;
};

/**
 * Primary workspace navigation. Team-scoped items link into the current team,
 * so the sidebar follows the switcher selection.
 */
export function AppSidebar({ user, teams, team }: AppSidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${team.slug}`;

  const items: Array<{
    label: string;
    href: string;
    icon: IconSvgElement;
    exact?: boolean;
  }> = [
    { label: "Overview", href: base, icon: DashboardSquare01Icon, exact: true },
    { label: "Domains", href: `${base}/domains`, icon: Globe02Icon },
    { label: "Activity", href: `${base}/activity`, icon: Activity01Icon },
    { label: "Integrations", href: `${base}/integrations`, icon: PuzzleIcon },
    { label: "Settings", href: `${base}/settings`, icon: Settings01Icon },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center px-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <NetgoatLogo
            size="sm"
            href="/dashboard"
            className="group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>span]:hidden"
          />
        </div>
        <TeamSwitcher teams={teams} current={team} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

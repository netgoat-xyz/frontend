"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import type { TeamOption } from "@/components/dashboard/team-switcher";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import type { ShellUser } from "@/components/dashboard/user-menu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type DashboardShellProps = {
  user: ShellUser;
  teams: TeamOption[];
  team: TeamOption;
  children: React.ReactNode;
};

/**
 * Authenticated layout: collapsible sidebar, slim top bar with the mobile
 * trigger and theme switch, content area on the inset surface.
 */
export function DashboardShell({
  user,
  teams,
  team,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} teams={teams} team={team} />

      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {team.name}
          </span>
          <div className="ms-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

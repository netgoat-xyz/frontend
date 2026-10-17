"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { teamAccent, teamInitial } from "@/lib/team-appearance";

export type TeamOption = {
  slug: string;
  name: string;
};

/** Colour tile with the team's initial. */
export function TeamAvatar({
  team,
  className,
}: {
  team: TeamOption;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white",
        teamAccent(team.slug),
        className,
      )}
    >
      {teamInitial(team.name)}
    </span>
  );
}

/**
 * Workspace switcher at the top of the sidebar: current team, quick switch
 * between teams and links to team management.
 */
export function TeamSwitcher({
  teams,
  current,
}: {
  teams: TeamOption[];
  current: TeamOption;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />
        }
      >
        <TeamAvatar team={current} className="size-6 rounded-md text-xs" />
        <span className="grid flex-1 text-start leading-tight">
          <span className="truncate text-sm font-medium">{current.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {current.slug}
          </span>
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          className="text-muted-foreground ms-auto size-4"
        />
      </MenuTrigger>

      <MenuPopup align="start" className="min-w-56">
        <MenuGroup>
          <MenuGroupLabel>Teams</MenuGroupLabel>
          {teams.map((team) => (
            <MenuLinkItem key={team.slug} render={<Link href={`/dashboard/${team.slug}`} />}>
              <TeamAvatar team={team} />
              <span className="truncate">{team.name}</span>
              {team.slug === current.slug ? (
                <HugeiconsIcon icon={Tick02Icon} className="ms-auto size-4" />
              ) : null}
            </MenuLinkItem>
          ))}
        </MenuGroup>

        <MenuSeparator />

        <MenuLinkItem render={<Link href="/dashboard/teams" />}>
          All teams
        </MenuLinkItem>
        <MenuLinkItem render={<Link href="/dashboard/teams/new" />}>
          Create team
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  );
}

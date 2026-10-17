"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  Logout01Icon,
  Settings01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export type ShellUser = {
  name: string;
  email: string;
  image?: string | null;
};

/** Account menu pinned to the sidebar footer. */
export function UserMenu({ user }: { user: ShellUser }) {
  const initials = (user.name.trim()[0] ?? user.email[0] ?? "U").toUpperCase();

  return (
    <Menu>
      <MenuTrigger
        render={
          <SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />
        }
      >
        <Avatar className="size-6 rounded-md">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="rounded-md text-[10px]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="grid flex-1 text-start leading-tight">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {user.email}
          </span>
        </span>
      </MenuTrigger>

      <MenuPopup align="start" side="top" className="min-w-52">
        <MenuGroup>
          <MenuGroupLabel className="truncate">{user.email}</MenuGroupLabel>
          <MenuLinkItem render={<Link href="/account" />}>
            <HugeiconsIcon icon={UserCircleIcon} />
            Account
          </MenuLinkItem>
          <MenuLinkItem render={<Link href="/account/billing" />}>
            <HugeiconsIcon icon={CreditCardIcon} />
            Billing
          </MenuLinkItem>
          <MenuLinkItem render={<Link href="/account/settings" />}>
            <HugeiconsIcon icon={Settings01Icon} />
            Settings
          </MenuLinkItem>
        </MenuGroup>

        <MenuSeparator />

        <MenuLinkItem
          render={<Link href="/logout" />}
          className="text-destructive-foreground"
        >
          <HugeiconsIcon icon={Logout01Icon} />
          Sign out
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  );
}

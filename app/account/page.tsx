import type { Metadata } from "next";

import { ProfileForm } from "@/components/account/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function AccountPage() {
  const user = await requireUser();
  const initials = (user.name.trim()[0] ?? user.email[0] ?? "U").toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 rounded-xl">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="rounded-xl text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="font-heading truncate text-lg font-semibold tracking-tight">
            {user.name}
          </span>
          <span className="text-muted-foreground truncate text-sm">
            {user.email}
          </span>
        </div>
      </div>

      <ProfileForm
        initialName={user.name}
        email={user.email}
        emailVerified={Boolean(user.emailVerified)}
      />
    </div>
  );
}

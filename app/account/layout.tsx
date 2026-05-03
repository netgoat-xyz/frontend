import NavigationTop from "@/components/elements/NavigationTop";
import { AppSessionProvider } from "@/components/auth/AppSessionContext";
import { auth } from "@/lib/auth";
import { isBannedSessionUser } from "@/lib/user-status";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  if (isBannedSessionUser(session)) {
    redirect("/banned");
  }

  const sessionForClient = {
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  };

  return (
    <AppSessionProvider session={sessionForClient}>
      <>
        <NavigationTop />
        <main className="min-h-svh bg-neutral-950">{children}</main>
      </>
    </AppSessionProvider>
  );
}

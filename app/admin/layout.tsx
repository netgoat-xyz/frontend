import NavigationTop from "@/components/elements/NavigationTop";
import { AppSessionProvider } from "@/components/auth/AppSessionContext";
import { auth } from "@/lib/auth";
import { isBannedSessionUser } from "@/lib/user-status";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/auth/login');
  }

  if (isBannedSessionUser(session)) {
    redirect('/banned');
  }

  if (session.user.role !== 'admin') {
    redirect('/error/forbidden'); // Or just redirect to dashboard
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
      <div suppressHydrationWarning className="min-h-svh w-full flex flex-col bg-neutral-50 dark:bg-neutral-950 text-foreground">
        <NavigationTop />

        <main className="min-h-svh w-full flex flex-col items-center">
          <div className="container mx-auto px-4 py-8 md:px-8 max-w-7xl flex-1 mt-6 mb-12">
            {children}
          </div>
        </main>

        <BelowScreenFooter />
      </div>
    </AppSessionProvider>
  );
}

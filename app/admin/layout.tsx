import NavigationTop from "@/components/elements/NavigationTop";
import { auth } from "@/lib/auth";
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
    redirect('/auth/login' as any);
  }

  if (session.user.role !== 'admin') {
    redirect('/error/forbidden'); // Or just redirect to dashboard
  }

  return (
    <div suppressHydrationWarning className="min-h-screen w-full flex flex-col bg-neutral-950">
      <NavigationTop />
      <div className="flex-1 flex flex-col">
          <div className="border-b border-neutral-800 bg-neutral-900/50 py-8">
            <div className="container mx-auto px-6">
                <h1 className="text-2xl font-bold text-white mb-2">Site Administration</h1>
                <p className="text-neutral-400 text-sm mb-6">Manage users, system settings, and global configurations.</p>
            </div>
          </div>
          <main className="container mx-auto py-8 w-full flex-1">
            {children}
          </main>
      </div>
      <BelowScreenFooter />
    </div>
  );
}

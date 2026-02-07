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

          <main className="container mx-auto py-8 w-full flex-1">
            {children}
 </main>
    </div>
  );
}

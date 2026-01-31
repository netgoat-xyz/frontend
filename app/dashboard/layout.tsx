import NavigationTop from "@/components/elements/NavigationTop";
import { auth } from "@/lib/auth";
import { redirect } from "next/dist/client/components/navigation";
import { headers } from "next/dist/server/request/headers";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth')
  }

  return (
    <div suppressHydrationWarning>
      <NavigationTop />
      <main className="p-6">{children}</main>
    </div>
  );
}

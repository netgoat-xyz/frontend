import NavigationTop from "@/components/elements/NavigationTop";
import { auth } from "@/lib/auth";
import { redirect } from "next/dist/client/components/navigation";
import { headers } from "next/dist/server/request/headers";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";
import { getLatestWhatsNew } from "@/actions/content";
import WhatsNewPopup from "@/components/elements/WhatsNewPopup";

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

  const latestWhatsNew = await getLatestWhatsNew();

  return (
    <div suppressHydrationWarning>
      <WhatsNewPopup post={latestWhatsNew} />
      <NavigationTop />
      <main className="p-6">{children}</main>
    </div>
  );
}

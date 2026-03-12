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
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const latestWhatsNew = await getLatestWhatsNew();

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full flex flex-col bg-neutral-50 dark:bg-neutral-950 text-foreground"
    >
      <WhatsNewPopup post={latestWhatsNew} />
      <NavigationTop />
      <main className="flex-1 p-6">{children}</main>
      <BelowScreenFooter />
    </div>
  );
}

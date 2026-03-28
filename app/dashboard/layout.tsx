import NavigationTop from "@/components/elements/NavigationTop";
import { auth } from "@/lib/auth";
import { redirect } from "next/dist/client/components/navigation";
import { headers } from "next/dist/server/request/headers";
import BelowScreenFooter from "@/components/elements/BelowScreenFooter";
import { getLatestWhatsNew } from "@/actions/content";
import dynamic from "next/dynamic";

const WhatsNewPopup = dynamic(
  () => import("@/components/elements/WhatsNewPopup"),
  { loading: () => null }
);

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
      className="min-h-svh w-full flex flex-col bg-neutral-50 dark:bg-neutral-950 text-foreground"
    >
      <WhatsNewPopup post={latestWhatsNew} />
      <NavigationTop />
      <main className="min-h-svh p-6">{children}</main>
      <BelowScreenFooter />
    </div>
  );
}

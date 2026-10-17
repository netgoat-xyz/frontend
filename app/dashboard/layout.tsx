import { requireUser } from "@/lib/auth-guards";

/**
 * Auth gate for the whole dashboard area. The visual shell lives in the
 * team-scoped layout so it can receive the active team.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <div className="bg-background text-foreground min-h-svh">{children}</div>;
}

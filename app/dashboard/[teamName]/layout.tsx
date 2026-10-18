import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

/**
 * Team-scoped layout: resolves the team, verifies membership and mounts the
 * shared workspace chrome.
 */
export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  return <WorkspaceShell teamSlug={teamName}>{children}</WorkspaceShell>;
}

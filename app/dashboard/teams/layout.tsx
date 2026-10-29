import { WorkspaceShell } from "@/components/dashboard/workspace-shell";

/**
 * Team management keeps the dashboard chrome — the sidebar follows you here
 * instead of dropping into a bare page.
 */
export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceShell contextLabel="Teams">{children}</WorkspaceShell>;
}

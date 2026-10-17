import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IntegrationsCatalog } from "@/components/dashboard/integrations-catalog";
import { PageHeader } from "@/components/dashboard/page-header";
import { getTeamContext } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { team } = await getTeamContext(teamName);
  if (!team) notFound();

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect surrounding services — DNS providers, error tracking and observability."
      />
      <IntegrationsCatalog />
    </>
  );
}

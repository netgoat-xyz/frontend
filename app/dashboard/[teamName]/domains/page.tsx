import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DomainsGrid } from "@/components/dashboard/domains-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { getTeamContext } from "@/lib/auth-guards";
import { listTeamDomainSummaries } from "@/lib/data/domains";

export const metadata: Metadata = {
  title: "Domains",
};

export default async function TeamDomainsPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { team } = await getTeamContext(teamName);
  if (!team) notFound();

  const domains = await listTeamDomainSummaries(String(team._id));

  return (
    <>
      <PageHeader
        title="Domains"
        description={`${domains.length} of ${team.max_domains} domains on the ${team.plan} plan.`}
      />
      <DomainsGrid teamSlug={team.slug} domains={domains} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SubdomainsManager } from "@/components/domain/subdomains-manager";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Subdomains",
};

export default async function DomainSubdomainsPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);

  return (
    <>
      <PageHeader
        title="Subdomains"
        description="Additional hostnames under this domain, each with its own configuration."
      />
      <SubdomainsManager
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        domainName={domain.domain}
        subdomains={domain.subdomains}
      />
    </>
  );
}

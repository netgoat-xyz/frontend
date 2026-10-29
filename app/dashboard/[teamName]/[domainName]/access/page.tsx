import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { AccessForm } from "@/components/domain/access-form";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Access",
};

export default async function DomainAccessPage({
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
        title="Access control"
        description="Allow or block traffic by IP address before it reaches the origin."
      />
      <AccessForm
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        hostname={domain.domain}
        initial={domain.access_control}
      />
    </>
  );
}

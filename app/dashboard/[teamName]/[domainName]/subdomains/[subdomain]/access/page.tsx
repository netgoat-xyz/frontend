import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { AccessForm } from "@/components/domain/access-form";
import { getSubdomainRoute } from "@/lib/data/domain-detail";
import { normalizeAccessControl } from "@/lib/control-plane";

export const metadata: Metadata = {
  title: "Subdomain access",
};

export default async function SubdomainAccessPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string; subdomain: string }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const { subdomain } = route;
  const initial = normalizeAccessControl(subdomain.access_control, {
    allowInherit: true,
    defaultMode: "inherit",
  });

  return (
    <>
      <PageHeader
        title="Access control"
        description={`IP allow/block rules for ${subdomain.full_domain}, or inherit the domain policy.`}
      />
      <AccessForm
        teamSlug={route.context.team.slug}
        domainId={String(route.domain._id)}
        subdomain={subdomain.subdomain}
        hostname={subdomain.full_domain}
        initial={initial}
        allowInherit
      />
    </>
  );
}

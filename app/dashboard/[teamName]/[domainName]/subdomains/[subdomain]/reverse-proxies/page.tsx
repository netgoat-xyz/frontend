import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { RoutesManager } from "@/components/domain/routes-manager";
import { getSubdomainRoute, listDomainProxyConfigs } from "@/lib/data/domain-detail";
import { toClientProxyConfig } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Subdomain routes",
};

export default async function SubdomainReverseProxiesPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string; subdomain: string }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const { context, domain, subdomain } = route;

  const configs = await listDomainProxyConfigs(
    String(context.team._id),
    String(domain._id),
  );

  const scoped = configs.filter(
    (config) => config.subdomain === subdomain.subdomain,
  );

  return (
    <>
      <PageHeader
        title="Routes"
        description={`Upstream pools for ${subdomain.full_domain}.`}
      />
      <RoutesManager
        teamSlug={context.team.slug}
        domainId={String(domain._id)}
        domainName={domain.domain}
        configs={scoped.map(toClientProxyConfig)}
        scopes={[
          { value: subdomain.subdomain, label: subdomain.full_domain },
        ]}
        lockedScope={subdomain.subdomain}
      />
    </>
  );
}

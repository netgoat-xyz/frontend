import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { RoutesManager } from "@/components/domain/routes-manager";
import { getDomainRoute, listDomainProxyConfigs } from "@/lib/data/domain-detail";
import { toClientDomain, toClientProxyConfig } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Reverse proxies",
};

export default async function DomainReverseProxiesPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);
  const configs = await listDomainProxyConfigs(
    String(route.context.team._id),
    domain._id,
  );

  const scopes = [
    { value: "", label: domain.domain },
    ...domain.subdomains.map((entry) => ({
      value: entry.subdomain,
      label: entry.full_domain,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Reverse proxies"
        description="Balance traffic across upstream pools per hostname."
      />
      <RoutesManager
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        domainName={domain.domain}
        configs={configs.map(toClientProxyConfig)}
        scopes={scopes}
      />
    </>
  );
}
